import torch
import numpy as np
from typing import List, Dict, Optional
import pickle
import os
from pathlib import Path
import logging
from datetime import datetime
from collections import Counter
from app.models.schemas import UserProfile


class EmbeddingService:
    """Service for generating user embeddings from GNN model"""

    def __init__(self):
        self.model_path = Path("model/lightgcn_mpd_lfm.pt")
        self.mapping_path = Path("model/track_artist_mapping.pkl")
        self.embeddings_path = Path("model/precomputed_embeddings.pkl")

        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.track_embeddings = {}
        self.artist_embeddings = {}
        self.track_to_id = {}
        self.artist_to_id = {}

        # Initialize logger
        self.logger = logging.getLogger(__name__)

        self._load_model_and_embeddings()

    def _safe_log(self, message: str) -> str:
        """
        Make log message safe for Windows console encoding

        Replaces non-ASCII characters with ASCII equivalents
        """
        try:
            # Try to encode as ASCII, if fails, use unicode escape
            message.encode('ascii')
            return message
        except UnicodeEncodeError:
            # Replace non-ASCII with unicode escape sequences
            return message.encode('ascii', errors='backslashreplace').decode('ascii')

    def _load_model_and_embeddings(self):
        """Load precomputed embeddings and mappings"""
        try:
            # Check if model files exist
            if not self.embeddings_path.exists():
                print(f"Warning: Embeddings file not found at {self.embeddings_path}")
                print("Please run the training notebook first to generate embeddings")
                # Create dummy embeddings for development
                self._create_dummy_embeddings()
                return

            # Load precomputed embeddings
            with open(self.embeddings_path, "rb") as f:
                data = pickle.load(f)
                self.track_embeddings = data.get("track_embeddings", {})
                self.artist_embeddings = data.get("artist_embeddings", {})

            # Load mappings (track/artist name -> ID -> embedding)
            if self.mapping_path.exists():
                with open(self.mapping_path, "rb") as f:
                    mappings = pickle.load(f)
                    self.track_to_id = mappings.get("track_to_id", {})
                    self.artist_to_id = mappings.get("artist_to_id", {})

            print(f"Loaded {len(self.track_embeddings)} track embeddings")
            print(f"Loaded {len(self.artist_embeddings)} artist embeddings")

        except Exception as e:
            print(f"Error loading embeddings: {str(e)}")
            self._create_dummy_embeddings()

    def _create_dummy_embeddings(self):
        """Create dummy embeddings for development/testing"""
        print("Creating dummy embeddings for development...")
        self.embedding_dim = 128
        # Create some dummy artist embeddings
        dummy_artists = [
            "Radiohead", "The Beatles", "Pink Floyd", "Led Zeppelin",
            "Nirvana", "Daft Punk", "Aphex Twin", "Boards of Canada"
        ]
        for artist in dummy_artists:
            self.artist_embeddings[artist] = np.random.randn(128).astype(np.float32)
            self.artist_to_id[artist.lower()] = artist

    def _normalize_name(self, name: str) -> str:
        """Normalize track/artist name for matching"""
        return name.lower().strip()

    def get_track_embedding(self, track_name: str, artist_name: str) -> Optional[np.ndarray]:
        """Get embedding for a specific track"""
        # Try exact match first
        key = f"{self._normalize_name(track_name)}||{self._normalize_name(artist_name)}"
        if key in self.track_embeddings:
            return self.track_embeddings[key]

        # Try just track name
        track_key = self._normalize_name(track_name)
        if track_key in self.track_embeddings:
            return self.track_embeddings[track_key]

        # Fallback to artist embedding
        return self.get_artist_embedding(artist_name)

    def get_artist_embedding(self, artist_name: str) -> Optional[np.ndarray]:
        """Get embedding for a specific artist"""
        normalized = self._normalize_name(artist_name)

        if normalized in self.artist_embeddings:
            return self.artist_embeddings[normalized]

        # Try fuzzy matching (simple version)
        for key in self.artist_embeddings.keys():
            if normalized in key or key in normalized:
                return self.artist_embeddings[key]

        return None

    def generate_zero_shot_embedding(self, item_name: str, item_type: str = 'artist') -> Optional[np.ndarray]:
        """
        Generate approximate embedding for unknown artist/track using similar items

        This is a fallback when an item doesn't exist in the trained GNN.
        Uses average of embeddings from similar items.

        Args:
            item_name: Artist or track name
            item_type: 'artist' or 'track'

        Returns:
            Approximate embedding or None
        """
        # Try fuzzy matching first with existing embeddings
        embeddings_dict = self.artist_embeddings if item_type == 'artist' else self.track_embeddings
        normalized_name = self._normalize_name(item_name)

        # Find partial matches
        candidates = []
        for key, emb in embeddings_dict.items():
            # Partial match scoring
            if normalized_name in key or key in normalized_name:
                score = len(set(normalized_name.split()) & set(key.split())) / max(len(normalized_name.split()), len(key.split()))
                if score > 0.3:  # Threshold for similarity
                    candidates.append((emb, score))

        if candidates:
            # Weighted average based on similarity scores
            embeddings = [c[0] for c in candidates[:5]]  # Top 5 matches
            weights = [c[1] for c in candidates[:5]]

            avg_embedding = np.average(embeddings, axis=0, weights=weights)

            # Normalize
            norm = np.linalg.norm(avg_embedding)
            if norm > 0:
                avg_embedding = avg_embedding / norm

            self.logger.info(f"Zero-shot embedding for '{item_name}' using {len(embeddings)} similar items")
            return avg_embedding.astype(np.float32)

        return None

    def calculate_temporal_decay(self, timestamp: int, current_time: int, half_life_days: float = 30.0) -> float:
        """
        Calculate exponential temporal decay weight

        Uses exponential decay formula: weight = 0.5^(days_ago / half_life)

        Args:
            timestamp: Unix timestamp of the scrobble
            current_time: Current unix timestamp
            half_life_days: Days for weight to decay to 50% (default: 30)

        Returns:
            Decay weight between 0 and 1
        """
        days_ago = (current_time - timestamp) / (24 * 3600)
        decay_weight = 0.5 ** (days_ago / half_life_days)
        return decay_weight

    def generate_user_embedding_temporal(self, profile_data: Dict) -> np.ndarray:
        """
        Generate user embedding from multi-period listening history

        Combines:
        - Overall (15%), 6month (25%), 3month (35%), recent (25%)
        - Artists 40%, Tracks 60% within each period
        - Temporal decay in recent_tracks

        Args:
            profile_data: Dict from get_user_profile_multi_period()

        Returns:
            Normalized user embedding vector
        """
        embeddings = []
        weights = []

        # For logging coverage
        total_items = 0
        missing_artists = set()
        missing_tracks = set()

        current_time = int(datetime.utcnow().timestamp())

        # Period weights (sum to 0.75, leaving 0.25 for recent_tracks)
        period_weights = {
            'overall': 0.15,
            '6month': 0.25,
            '3month': 0.35
        }

        # Process each period
        for period, period_weight in period_weights.items():
            artists = profile_data.get('artists', {}).get(period, [])
            tracks = profile_data.get('tracks', {}).get(period, [])

            if not artists and not tracks:
                self.logger.warning(f"No data for period: {period}")
                continue

            # Calculate max playcount for normalization within this period
            max_playcount = max(
                [a.playcount for a in artists] +
                [t.playcount for t in tracks] +
                [1]
            )

            # Process artists (40% of period weight)
            for artist in artists:
                total_items += 1
                emb = self.get_artist_embedding(artist.name)

                # Try zero-shot if not found
                if emb is None:
                    emb = self.generate_zero_shot_embedding(artist.name, 'artist')

                if emb is not None:
                    # Logarithmic scaling of playcount
                    playcount_weight = np.log1p(artist.playcount) / np.log1p(max_playcount)
                    final_weight = period_weight * 0.4 * playcount_weight

                    embeddings.append(emb)
                    weights.append(final_weight)
                else:
                    missing_artists.add(artist.name)

            # Process tracks (60% of period weight)
            for track in tracks:
                total_items += 1
                emb = self.get_track_embedding(track.name, track.artist)

                # Try zero-shot if not found
                if emb is None:
                    emb = self.generate_zero_shot_embedding(f"{track.name} {track.artist}", 'track')

                if emb is not None:
                    playcount_weight = np.log1p(track.playcount) / np.log1p(max_playcount)
                    final_weight = period_weight * 0.6 * playcount_weight

                    embeddings.append(emb)
                    weights.append(final_weight)
                else:
                    missing_tracks.add(f"{track.name}||{track.artist}")

        # Process recent tracks with temporal decay (25% total weight)
        recent_tracks = profile_data.get('recent_tracks', [])
        recent_weight_budget = 0.25

        if recent_tracks:
            # Count occurrences and track most recent timestamp for each track
            track_data = {}  # key: (track_name, artist) -> {'count': int, 'last_timestamp': int}

            for rt in recent_tracks:
                if rt.timestamp is None:  # Skip nowplaying
                    continue

                key = (rt.name, rt.artist)
                if key not in track_data:
                    track_data[key] = {'count': 0, 'last_timestamp': rt.timestamp}

                track_data[key]['count'] += 1
                track_data[key]['last_timestamp'] = max(
                    track_data[key]['last_timestamp'],
                    rt.timestamp
                )

            # Process each unique track with temporal decay
            if track_data:  # Only if we have valid track data
                max_count = max([td['count'] for td in track_data.values()])

                for (track_name, artist_name), data in track_data.items():
                    total_items += 1
                    emb = self.get_track_embedding(track_name, artist_name)

                    # Try zero-shot if not found
                    if emb is None:
                        emb = self.generate_zero_shot_embedding(f"{track_name} {artist_name}", 'track')

                    if emb is not None:
                        # Decay weight based on recency (30 day half-life)
                        decay = self.calculate_temporal_decay(
                            data['last_timestamp'],
                            current_time,
                            half_life_days=30.0
                        )

                        # Weight by count (log scale) and recency
                        count_weight = np.log1p(data['count']) / np.log1p(max_count)
                        final_weight = recent_weight_budget * decay * count_weight

                        embeddings.append(emb)
                        weights.append(final_weight)
                    else:
                        missing_tracks.add(f"{track_name}||{artist_name}")

        # Logging: Coverage statistics
        total_missing = len(missing_artists) + len(missing_tracks)
        coverage = ((total_items - total_missing) / total_items * 100) if total_items > 0 else 0

        self.logger.info("=" * 60)
        self.logger.info(f"EMBEDDING STATS: {profile_data.get('username')}")
        self.logger.info("=" * 60)
        self.logger.info(f"Total items: {total_items}")
        self.logger.info(f"Items with embeddings: {total_items - total_missing}")
        self.logger.info(f"Coverage: {coverage:.2f}%")
        self.logger.info(f"Missing artists: {len(missing_artists)}")
        self.logger.info(f"Missing tracks: {len(missing_tracks)}")

        if missing_artists:
            self.logger.info(f"\nTop 10 missing artists:")
            for artist in list(missing_artists)[:10]:
                safe_artist = self._safe_log(artist)
                self.logger.info(f"  - {safe_artist}")

        if missing_tracks:
            self.logger.info(f"\nTop 10 missing tracks:")
            for track in list(missing_tracks)[:10]:
                parts = track.split('||')
                if len(parts) == 2:
                    safe_track = self._safe_log(f"{parts[0]} by {parts[1]}")
                    self.logger.info(f"  - {safe_track}")

        self.logger.info("=" * 60)

        # Fallback if no embeddings found
        if not embeddings:
            self.logger.error(f"No embeddings found for {profile_data.get('username')}!")
            return np.random.randn(128).astype(np.float32)

        # Compute weighted average
        embeddings = np.array(embeddings)
        weights = np.array(weights)
        weights = weights / weights.sum()  # Normalize weights to sum to 1

        user_embedding = np.average(embeddings, axis=0, weights=weights)

        # Normalize to unit vector (for cosine similarity)
        norm = np.linalg.norm(user_embedding)
        if norm > 0:
            user_embedding = user_embedding / norm

        self.logger.info(f"Final embedding shape: {user_embedding.shape}")
        self.logger.info(f"Embedding norm: {np.linalg.norm(user_embedding):.4f}")

        return user_embedding.astype(np.float32)

    def generate_user_embedding(self, profile: UserProfile) -> np.ndarray:
        """
        Generate user embedding from their listening history
        Uses weighted average of track/artist embeddings

        DEPRECATED: Use generate_user_embedding_temporal() for better results
        """
        embeddings = []
        weights = []

        # Weight by playcount (logarithmic scale to avoid outliers)
        max_playcount = max([a.playcount for a in profile.top_artists] + [1])

        # Add top artists (40% weight)
        for artist in profile.top_artists[:50]:
            emb = self.get_artist_embedding(artist.name)
            if emb is not None:
                weight = np.log1p(artist.playcount) / np.log1p(max_playcount)
                embeddings.append(emb)
                weights.append(weight * 0.4)

        # Add top tracks (60% weight - tracks are more specific)
        for track in profile.top_tracks[:50]:
            emb = self.get_track_embedding(track.name, track.artist)
            if emb is not None:
                weight = np.log1p(track.playcount) / np.log1p(max_playcount)
                embeddings.append(emb)
                weights.append(weight * 0.6)

        # If no embeddings found, create a random one (for development)
        if not embeddings:
            print(f"Warning: No embeddings found for user {profile.username}")
            return np.random.randn(128).astype(np.float32)

        # Compute weighted average
        embeddings = np.array(embeddings)
        weights = np.array(weights)
        weights = weights / weights.sum()  # Normalize weights

        user_embedding = np.average(embeddings, axis=0, weights=weights)

        # Normalize to unit vector (for cosine similarity)
        norm = np.linalg.norm(user_embedding)
        if norm > 0:
            user_embedding = user_embedding / norm

        return user_embedding.astype(np.float32)

    def compute_similarity(self, emb1: np.ndarray, emb2: np.ndarray) -> float:
        """Compute cosine similarity between two embeddings"""
        return float(np.dot(emb1, emb2))

    def infer_genres_from_tags(self, artist_tags: Dict[str, List[str]], top_artists: List[str]) -> List[str]:
        """
        Infer top genres from Last.fm artist tags

        Args:
            artist_tags: Dict mapping artist name -> list of tags
            top_artists: List of artist names in priority order

        Returns:
            Top 5 most common genres/tags
        """
        tag_counter = Counter()

        # Weight tags by artist position (top artists contribute more)
        for idx, artist in enumerate(top_artists[:10]):
            if artist in artist_tags:
                tags = artist_tags[artist]
                # Weight decreases with position: 1.0, 0.9, 0.8, ..., 0.1
                weight = 1.0 - (idx * 0.1)
                for tag in tags:
                    tag_counter[tag] += weight

        # Return top 5 genres
        top_genres = [tag for tag, count in tag_counter.most_common(5)]

        self.logger.info(f"Inferred genres: {top_genres}")
        return top_genres


# Singleton instance
embedding_service = EmbeddingService()
