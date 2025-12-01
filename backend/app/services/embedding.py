import torch
import numpy as np
from typing import List, Dict, Optional
import pickle
import os
from pathlib import Path
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

        self._load_model_and_embeddings()

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

    def generate_user_embedding(self, profile: UserProfile) -> np.ndarray:
        """
        Generate user embedding from their listening history
        Uses weighted average of track/artist embeddings
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

    def infer_genres_from_artists(self, artists: List[str]) -> List[str]:
        """Infer top genres from artist names (simplified version)"""
        # In a production system, you'd use a proper genre classifier
        # or lookup table from the training data
        genre_keywords = {
            "electronic": ["daft punk", "aphex twin", "boards of canada", "autechre"],
            "rock": ["radiohead", "the beatles", "pink floyd", "led zeppelin", "nirvana"],
            "hip-hop": ["kendrick lamar", "kanye west", "jay-z", "eminem"],
            "indie": ["arcade fire", "the national", "vampire weekend"],
        }

        detected_genres = set()
        for artist in artists[:10]:
            artist_lower = artist.lower()
            for genre, keywords in genre_keywords.items():
                if any(kw in artist_lower for kw in keywords):
                    detected_genres.add(genre)

        return list(detected_genres)[:5]


# Singleton instance
embedding_service = EmbeddingService()
