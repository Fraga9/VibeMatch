import torch
import numpy as np
from typing import List, Dict, Optional, Tuple
import pickle
import os
from pathlib import Path
import logging
from datetime import datetime
from collections import Counter, OrderedDict
from app.models.schemas import UserProfile
import threading
import time

try:
    import faiss
    FAISS_AVAILABLE = True
except ImportError:
    FAISS_AVAILABLE = False
    print("⚠️  FAISS not available. Install with: pip install faiss-cpu (or faiss-gpu)")


class LRUCache:
    """Thread-safe LRU cache - lock only on writes for better concurrency"""
    def __init__(self, max_size: int = 15000):
        self.cache = OrderedDict()
        self.max_size = max_size
        self.hits = 0
        self.misses = 0
        self._write_lock = threading.Lock()  # Only for writes
    
    def get(self, key):
        """Get value from cache - NO LOCK for reads (fast path)"""
        # Reads without lock are safe - worst case is slightly stale data
        try:
            if key in self.cache:
                self.hits += 1
                # Don't move_to_end on reads to avoid needing lock
                return self.cache[key]
        except (KeyError, RuntimeError):
            # Handle rare case of concurrent modification
            pass
        self.misses += 1
        return None
    
    def set(self, key, value):
        """Set value in cache - LOCKED for writes"""
        with self._write_lock:
            if key in self.cache:
                self.cache.move_to_end(key)
            else:
                if len(self.cache) >= self.max_size:
                    self.cache.popitem(last=False)
            self.cache[key] = value
    
    def __getitem__(self, key):
        """Allow dict-style access: cache[key]"""
        result = self.get(key)
        if result is None:
            raise KeyError(key)
        return result
    
    def __setitem__(self, key, value):
        """Allow dict-style assignment: cache[key] = value"""
        self.set(key, value)
    
    def __contains__(self, key):
        # No lock needed - worst case is false negative
        return key in self.cache
    
    def clear(self):
        with self._write_lock:
            self.cache.clear()
    
    def stats(self):
        """Get cache statistics - no lock, approximate values OK"""
        total = self.hits + self.misses
        hit_rate = (self.hits / total * 100) if total > 0 else 0
        return {
            "size": len(self.cache),
            "max_size": self.max_size,
            "hits": self.hits,
            "misses": self.misses,
            "hit_rate": f"{hit_rate:.1f}%"
        }


class EmbeddingService:
    """Service for generating user embeddings from GNN model (OPTIMIZED)

    Optimizations:
    - LRU cache with bounded memory usage (prevents memory leaks)
    - Memory-mapped files for efficient shared memory access
    - FAISS index for fast similarity search
    - GPU support for batch operations
    - Thread-safe singleton pattern
    """

    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        """Singleton pattern to ensure embeddings are loaded only once"""
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        # Skip if already initialized
        if hasattr(self, '_initialized') and self._initialized:
            return

        self.model_path = Path("model/lightgcn_mpd_lfm.pt")
        self.mapping_path = Path("model/track_artist_mapping.pkl")
        self.embeddings_path = Path("model/precomputed_embeddings.pkl")

        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

        self.track_embeddings = {}
        self.artist_embeddings = {}
        self.track_to_id = {}
        self.artist_to_id = {}

        self.track_faiss_index = None
        self.artist_faiss_index = None
        self.track_id_to_name = []
        self.artist_id_to_name = []

        # Initialize logger
        self.logger = logging.getLogger(__name__)

        # GPU cache for batch operations
        self.use_gpu = torch.cuda.is_available()
        self.batch_cache = {} if self.use_gpu else None

        # OPTIMIZED: LRU cache with bounded size (prevents memory leak)
        # Reduced to 8000 for DigitalOcean App Platform (1GB RAM)
        self.fuzzy_cache = LRUCache(max_size=8000)
        self.cache_hits = 0
        self.cache_misses = 0

        self._load_model_and_embeddings()
        self._initialized = True

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
        """Load precomputed embeddings and build FAISS indexes (OPTIMIZED)"""
        try:
            # Check if model files exist
            if not self.embeddings_path.exists():
                print(f"Warning: Embeddings file not found at {self.embeddings_path}")
                print("Please run the training notebook first to generate embeddings")
                # Create dummy embeddings for development
                self._create_dummy_embeddings()
                return

            print("🔄 Loading embeddings (optimized with shared memory)...")

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

            print(f"✅ Loaded {len(self.track_embeddings)} track embeddings")
            print(f"✅ Loaded {len(self.artist_embeddings)} artist embeddings")

            # Build FAISS indexes for fast similarity search
            if FAISS_AVAILABLE:
                self._build_faiss_indexes()
            else:
                print("⚠️  FAISS not available - using fallback search (slower)")

        except Exception as e:
            print(f"❌ Error loading embeddings: {str(e)}")
            self._create_dummy_embeddings()

    def _build_faiss_indexes(self):
        """Build FAISS indexes for fast nearest neighbor search"""
        print("🔨 Building FAISS indexes...")

        # Build track index
        if self.track_embeddings:
            track_embeddings_list = []
            self.track_id_to_name = []

            for name, emb in self.track_embeddings.items():
                track_embeddings_list.append(emb)
                self.track_id_to_name.append(name)

            track_embeddings_array = np.array(track_embeddings_list).astype('float32')
            embedding_dim = track_embeddings_array.shape[1]

            # Use GPU index if available
            if self.use_gpu and hasattr(faiss, 'StandardGpuResources'):
                try:
                    res = faiss.StandardGpuResources()
                    cpu_index = faiss.IndexFlatIP(embedding_dim)  # Inner product (cosine similarity)
                    self.track_faiss_index = faiss.index_cpu_to_gpu(res, 0, cpu_index)
                    print("  ✅ Track index on GPU")
                except Exception:
                    self.track_faiss_index = faiss.IndexFlatIP(embedding_dim)
                    print("  ✅ Track index on CPU (GPU failed)")
            else:
                self.track_faiss_index = faiss.IndexFlatIP(embedding_dim)
                print("  ✅ Track index on CPU")

            self.track_faiss_index.add(track_embeddings_array)

        # Build artist index
        if self.artist_embeddings:
            artist_embeddings_list = []
            self.artist_id_to_name = []

            for name, emb in self.artist_embeddings.items():
                artist_embeddings_list.append(emb)
                self.artist_id_to_name.append(name)

            artist_embeddings_array = np.array(artist_embeddings_list).astype('float32')
            embedding_dim = artist_embeddings_array.shape[1]

            # Use GPU index if available
            if self.use_gpu and hasattr(faiss, 'StandardGpuResources'):
                try:
                    res = faiss.StandardGpuResources()
                    cpu_index = faiss.IndexFlatIP(embedding_dim)
                    self.artist_faiss_index = faiss.index_cpu_to_gpu(res, 0, cpu_index)
                    print("  ✅ Artist index on GPU")
                except Exception:
                    self.artist_faiss_index = faiss.IndexFlatIP(embedding_dim)
                    print("  ✅ Artist index on CPU (GPU failed)")
            else:
                self.artist_faiss_index = faiss.IndexFlatIP(embedding_dim)
                print("  ✅ Artist index on CPU")

            self.artist_faiss_index.add(artist_embeddings_array)

        print(f"✅ FAISS indexes built: {len(self.track_id_to_name)} tracks, {len(self.artist_id_to_name)} artists")

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
        """Get embedding for a specific artist (OPTIMIZED with LRU cache)"""
        normalized = self._normalize_name(artist_name)

        # Try exact match first (O(1) lookup)
        if normalized in self.artist_embeddings:
            return self.artist_embeddings[normalized]

        # Check LRU cache for previous fuzzy matches
        cache_key = f"artist:{normalized}"
        cached_result = self.fuzzy_cache.get(cache_key)
        
        if cached_result is not None:
            # FIX: Use isinstance to avoid ambiguous comparison with numpy arrays
            if isinstance(cached_result, str):
                # It's either "__NOT_FOUND__" or an artist name
                if cached_result == "__NOT_FOUND__":
                    return None
                return self.artist_embeddings.get(cached_result)
            # If it's a numpy array (shouldn't happen here, but for safety)
            return cached_result

        # Try FAISS-based fuzzy matching
        # NOTE: _fuzzy_match_with_faiss already caches the result internally
        if FAISS_AVAILABLE and self.artist_faiss_index is not None:
            return self._fuzzy_match_with_faiss(normalized, 'artist')

        # Fallback to linear search (slower) with early exit
        for i, key in enumerate(self.artist_embeddings.keys()):
            if normalized in key or key in normalized:
                self.fuzzy_cache.set(cache_key, key)
                return self.artist_embeddings[key]
            # Early exit after checking 1000 entries
            if i > 1000:
                break

        # Cache negative result
        self.fuzzy_cache.set(cache_key, "__NOT_FOUND__")
        return None

    def _find_embedding_key(self, embedding: np.ndarray, entity_type: str) -> str:
        """Find the key for an embedding in the dictionary"""
        embeddings_dict = self.artist_embeddings if entity_type == 'artist' else self.track_embeddings
        for key, emb in embeddings_dict.items():
            if np.array_equal(emb, embedding):
                return key
        return "__NOT_FOUND__"

    def _fuzzy_match_with_faiss(self, query: str, entity_type: str = 'artist', k: int = 5) -> Optional[np.ndarray]:
        """Optimized fuzzy matching with early exit and scoring

        Args:
            query: The search query (artist or track name)
            entity_type: 'artist' or 'track'
            k: Number of candidates to consider

        Returns:
            Best matching embedding or None
        """
        embeddings_dict = self.artist_embeddings if entity_type == 'artist' else self.track_embeddings
        id_to_name = self.artist_id_to_name if entity_type == 'artist' else self.track_id_to_name

        cache_key = f"{entity_type}:{query}"

        # Find partial string matches with early exit
        candidates = []
        query_words = set(query.split())
        max_checks = min(len(id_to_name), 5000)  # Limit search scope

        for idx in range(max_checks):
            name = id_to_name[idx]

            # Quick substring check first (faster than word comparison)
            if query in name:
                # Exact substring match - high score
                score = 0.8 + (len(query) / len(name)) * 0.2
                candidates.append((idx, score, name))
                # If we have a very good match, can exit early
                if score > 0.95 and len(candidates) >= 3:
                    break
            elif name in query:
                score = 0.7
                candidates.append((idx, score, name))
            else:
                # Word-level matching (more expensive)
                name_words = set(name.split())
                if query_words and name_words:
                    overlap = len(query_words & name_words)
                    if overlap > 0:
                        score = overlap / max(len(query_words), len(name_words))
                        if score > 0.3:  # Threshold
                            candidates.append((idx, score, name))

            # Early exit if we have enough good candidates
            if len(candidates) >= 10:
                break

        if candidates:
            # Sort by score and cache/return best match
            candidates.sort(key=lambda x: x[1], reverse=True)
            best_idx, best_score, best_name = candidates[0]
            # Cache the successful match (already cached by name, not embedding)
            self.fuzzy_cache[cache_key] = best_name
            return embeddings_dict[best_name]

        # Cache negative result with sentinel
        self.fuzzy_cache[cache_key] = "__NOT_FOUND__"
        return None

    def generate_zero_shot_embedding(self, item_name: str, item_type: str = 'artist') -> Optional[np.ndarray]:
        """
        Generate approximate embedding for unknown artist/track using similar items (OPTIMIZED)

        This is a fallback when an item doesn't exist in the trained GNN.
        Uses average of embeddings from similar items.

        Args:
            item_name: Artist or track name
            item_type: 'artist' or 'track'

        Returns:
            Approximate embedding or None
        """
        # Check cache first
        cache_key = f"zero_shot:{item_type}:{self._normalize_name(item_name)}"
        cached_result = self.fuzzy_cache.get(cache_key)
        
        if cached_result is not None:
            # FIX: Use isinstance to avoid ambiguous comparison with numpy arrays
            if isinstance(cached_result, str):
                # It's the sentinel "__NOT_FOUND__"
                return None
            # It's a valid numpy array embedding
            return cached_result

        # Try fuzzy matching first with existing embeddings
        embeddings_dict = self.artist_embeddings if item_type == 'artist' else self.track_embeddings
        id_to_name = self.artist_id_to_name if item_type == 'artist' else self.track_id_to_name
        normalized_name = self._normalize_name(item_name)

        # Find partial matches (optimized with early exit)
        candidates = []
        normalized_words = set(normalized_name.split())
        max_checks = min(len(id_to_name if FAISS_AVAILABLE else list(embeddings_dict.keys())), 3000)

        search_list = id_to_name if FAISS_AVAILABLE else list(embeddings_dict.keys())

        for idx in range(max_checks):
            key = search_list[idx]

            # Quick substring check first
            if normalized_name in key:
                score = 0.8 + (len(normalized_name) / len(key)) * 0.2
                emb = embeddings_dict[key]
                candidates.append((emb, score))
                if score > 0.95 and len(candidates) >= 5:
                    break
            elif key in normalized_name:
                score = 0.7
                emb = embeddings_dict[key]
                candidates.append((emb, score))
            else:
                # Word-level matching
                key_words = set(key.split())
                if normalized_words and key_words:
                    overlap = len(normalized_words & key_words)
                    if overlap > 0:
                        score = overlap / max(len(normalized_words), len(key_words))
                        if score > 0.3:  # Threshold for similarity
                            emb = embeddings_dict[key]
                            candidates.append((emb, score))

            # Early exit if we have enough good candidates
            if len(candidates) >= 10:
                break

        if candidates:
            # Sort by score and take top 5
            candidates.sort(key=lambda x: x[1], reverse=True)
            top_candidates = candidates[:5]

            # Weighted average based on similarity scores
            embeddings = [c[0] for c in top_candidates]
            weights = [c[1] for c in top_candidates]

            avg_embedding = np.average(embeddings, axis=0, weights=weights)

            # Normalize
            norm = np.linalg.norm(avg_embedding)
            if norm > 0:
                avg_embedding = avg_embedding / norm

            result = avg_embedding.astype(np.float32)
            self.fuzzy_cache[cache_key] = result
            return result

        self.fuzzy_cache[cache_key] = "__NOT_FOUND__"
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

    def generate_user_embedding_temporal(self, profile_data: Dict, return_metadata: bool = False):
        """
        Generate user embedding optimized for user matching.
        WITH DETAILED TIMING INSTRUMENTATION

        Args:
            profile_data: User profile data with artists, tracks, etc.
            return_metadata: If True, return (embedding, metadata) tuple with match type details

        Returns:
            If return_metadata is False: np.ndarray
            If return_metadata is True: tuple of (np.ndarray, dict)
        """
        # Timing instrumentation
        timings = {
            'consistency_detection': 0,
            'artist_embedding_lookup': 0,
            'track_embedding_lookup': 0,
            'zero_shot_artist': 0,
            'zero_shot_track': 0,
            'recent_tracks': 0,
            'final_computation': 0
        }
        counts = {
            'artists_exact': 0,
            'artists_fuzzy': 0,
            'artists_zero_shot': 0,
            'artists_missing': 0,
            'tracks_exact': 0,
            'tracks_fuzzy': 0,
            'tracks_zero_shot': 0,
            'tracks_missing': 0,
        }

        # Track individual artists by match type (for metadata return)
        artists_fuzzy_list = []
        artists_missing_list = []
        artists_zero_shot_list = []

        total_start = time.time()
        
        embeddings = []
        weights = []
        
        current_time = int(datetime.utcnow().timestamp())
        
        # Track consistency across periods
        artist_periods = {}
        track_periods = {}
        
        t0 = time.time()
        # First pass: detect consistency across all periods
        for period in ['overall', '6month', '3month']:
            for artist in profile_data.get('artists', {}).get(period, []):
                name = self._normalize_name(artist.name)
                if name not in artist_periods:
                    artist_periods[name] = set()
                artist_periods[name].add(period)
            
            for track in profile_data.get('tracks', {}).get(period, []):
                key = f"{self._normalize_name(track.name)}||{self._normalize_name(track.artist)}"
                if key not in track_periods:
                    track_periods[key] = set()
                track_periods[key].add(period)
        timings['consistency_detection'] = time.time() - t0
        
        # Overall-first distribution
        period_weights = {
            'overall': 0.45,
            '6month': 0.25,
            '3month': 0.15,
        }
        recent_weight_budget = 0.15
        
        def get_consistency_multiplier(item_name: str, is_track: bool = False) -> float:
            periods_dict = track_periods if is_track else artist_periods
            periods_present = periods_dict.get(item_name, set())
            num_periods = len(periods_present)
            
            if num_periods >= 3:
                return 1.4
            elif num_periods == 2:
                if 'overall' in periods_present:
                    return 1.2
                return 1.0
            elif num_periods == 1:
                if 'overall' in periods_present:
                    return 1.0
                return 0.7
            return 1.0
        
        total_items = 0
        missing_items = 0
        
        # Process each period
        for period, period_weight in period_weights.items():
            artists = profile_data.get('artists', {}).get(period, [])
            tracks = profile_data.get('tracks', {}).get(period, [])
            
            if not artists and not tracks:
                continue
            
            max_playcount = max(
                [a.playcount for a in artists] +
                [t.playcount for t in tracks] +
                [1]
            )
            
            # Process artists
            for artist in artists:
                total_items += 1
                normalized = self._normalize_name(artist.name)
                
                t0 = time.time()
                
                # Check exact match first
                if normalized in self.artist_embeddings:
                    emb = self.artist_embeddings[normalized]
                    counts['artists_exact'] += 1
                else:
                    # Check cache
                    cache_key = f"artist:{normalized}"
                    cached = self.fuzzy_cache.get(cache_key)

                    if cached is not None:
                        if cached == "__NOT_FOUND__":
                            emb = None
                        else:
                            emb = self.artist_embeddings.get(cached)
                            artists_fuzzy_list.append(artist.name)  # Track fuzzy match
                        counts['artists_fuzzy'] += 1
                    else:
                        # Fuzzy search needed
                        emb = self._fuzzy_match_with_faiss(normalized, 'artist')
                        if emb is not None:
                            artists_fuzzy_list.append(artist.name)  # Track fuzzy match
                        counts['artists_fuzzy'] += 1
                
                timings['artist_embedding_lookup'] += time.time() - t0
                
                if emb is None:
                    t0 = time.time()
                    emb = self.generate_zero_shot_embedding(artist.name, 'artist')
                    timings['zero_shot_artist'] += time.time() - t0
                    if emb is not None:
                        counts['artists_zero_shot'] += 1
                        artists_zero_shot_list.append(artist.name)  # Track zero-shot

                if emb is not None:
                    normalized_name = self._normalize_name(artist.name)
                    consistency = get_consistency_multiplier(normalized_name, is_track=False)
                    playcount_weight = np.log1p(artist.playcount) / np.log1p(max_playcount)
                    final_weight = period_weight * 0.4 * playcount_weight * consistency
                    embeddings.append(emb)
                    weights.append(final_weight)
                else:
                    missing_items += 1
                    counts['artists_missing'] += 1
                    artists_missing_list.append(artist.name)  # Track missing
            
            # Process tracks
            for track in tracks:
                total_items += 1
                
                t0 = time.time()
                emb = self.get_track_embedding(track.name, track.artist)
                timings['track_embedding_lookup'] += time.time() - t0
                
                if emb is None:
                    t0 = time.time()
                    emb = self.generate_zero_shot_embedding(f"{track.name} {track.artist}", 'track')
                    timings['zero_shot_track'] += time.time() - t0
                    if emb is not None:
                        counts['tracks_zero_shot'] += 1
                else:
                    counts['tracks_exact'] += 1
                
                if emb is not None:
                    track_key = f"{self._normalize_name(track.name)}||{self._normalize_name(track.artist)}"
                    consistency = get_consistency_multiplier(track_key, is_track=True)
                    playcount_weight = np.log1p(track.playcount) / np.log1p(max_playcount)
                    final_weight = period_weight * 0.6 * playcount_weight * consistency
                    embeddings.append(emb)
                    weights.append(final_weight)
                else:
                    missing_items += 1
                    counts['tracks_missing'] += 1
        
        # Process recent tracks
        t0 = time.time()
        recent_tracks = profile_data.get('recent_tracks', [])
        
        if recent_tracks:
            track_data = {}
            
            for rt in recent_tracks:
                if rt.timestamp is None:
                    continue
                key = (rt.name, rt.artist)
                if key not in track_data:
                    track_data[key] = {'count': 0, 'last_timestamp': rt.timestamp}
                track_data[key]['count'] += 1
                track_data[key]['last_timestamp'] = max(
                    track_data[key]['last_timestamp'],
                    rt.timestamp
                )
            
            if track_data:
                max_count = max([td['count'] for td in track_data.values()])
                
                for (track_name, artist_name), data in track_data.items():
                    total_items += 1
                    emb = self.get_track_embedding(track_name, artist_name)
                    
                    if emb is None:
                        emb = self.generate_zero_shot_embedding(f"{track_name} {artist_name}", 'track')
                    
                    if emb is not None:
                        track_key = f"{self._normalize_name(track_name)}||{self._normalize_name(artist_name)}"
                        periods_present = track_periods.get(track_key, set())
                        if periods_present:
                            consistency = get_consistency_multiplier(track_key, is_track=True)
                        else:
                            consistency = 0.8
                        
                        decay = self.calculate_temporal_decay(
                            data['last_timestamp'],
                            current_time,
                            half_life_days=30.0
                        )
                        count_weight = np.log1p(data['count']) / np.log1p(max_count)
                        final_weight = recent_weight_budget * decay * count_weight * consistency
                        
                        embeddings.append(emb)
                        weights.append(final_weight)
                    else:
                        missing_items += 1
        
        timings['recent_tracks'] = time.time() - t0
        
        # Fallback if no embeddings found
        if not embeddings:
            self.logger.error(f"No embeddings found for {profile_data.get('username')}!")
            return np.random.randn(128).astype(np.float32)
        
        # Final computation
        t0 = time.time()
        embeddings = np.array(embeddings)
        weights = np.array(weights)
        weights = weights / weights.sum()
        
        if self.use_gpu and len(embeddings) > 30:
            try:
                embeddings_gpu = torch.from_numpy(embeddings).to(self.device)
                weights_gpu = torch.from_numpy(weights).to(self.device)
                user_embedding = torch.sum(embeddings_gpu * weights_gpu.unsqueeze(1), dim=0)
                user_embedding = user_embedding.cpu().numpy()
            except Exception:
                user_embedding = np.average(embeddings, axis=0, weights=weights)
        else:
            user_embedding = np.average(embeddings, axis=0, weights=weights)
        
        norm = np.linalg.norm(user_embedding)
        if norm > 0:
            user_embedding = user_embedding / norm
        
        timings['final_computation'] = time.time() - t0
        
        total_time = time.time() - total_start
        
        # DETAILED LOG OUTPUT
        username = profile_data.get('username', 'unknown')
        print(f"\n{'='*70}")
        print(f"⏱️  EMBEDDING TIMING FOR: {username}")
        print(f"{'='*70}")
        print(f"Total time: {total_time:.3f}s")
        print(f"\n📊 Breakdown:")
        for key, value in timings.items():
            pct = (value / total_time * 100) if total_time > 0 else 0
            print(f"  {key:30s}: {value:.3f}s ({pct:5.1f}%)")
        
        print(f"\n📈 Counts:")
        print(f"  Artists - exact: {counts['artists_exact']:3d}, fuzzy: {counts['artists_fuzzy']:3d}, zero-shot: {counts['artists_zero_shot']:3d}, missing: {counts['artists_missing']:3d}")
        print(f"  Tracks  - exact: {counts['tracks_exact']:3d}, fuzzy: {counts['tracks_fuzzy']:3d}, zero-shot: {counts['tracks_zero_shot']:3d}, missing: {counts['tracks_missing']:3d}")
        print(f"  Total items: {total_items}, Missing: {missing_items}, Coverage: {((total_items - missing_items) / total_items * 100):.1f}%")
        
        cache_stats = self.fuzzy_cache.stats()
        print(f"\n💾 Cache: size={cache_stats['size']}/{cache_stats['max_size']}, hit_rate={cache_stats['hit_rate']}")
        print(f"{'='*70}\n")

        # Return with metadata if requested
        if return_metadata:
            metadata = {
                'artists_fuzzy': artists_fuzzy_list,
                'artists_missing': artists_missing_list,
                'artists_zero_shot': artists_zero_shot_list,
                'counts': counts
            }
            return user_embedding.astype(np.float32), metadata

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
