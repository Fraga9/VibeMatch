"""
Fetch Last.fm users via social graph traversal (BFS) with producer-consumer pattern

Usage:
    python scripts/fetch_lastfm_users.py --seed-user Fraga9 --max-users 500 --fetchers 4 --processors 4
    python scripts/fetch_lastfm_users.py --seed-user "rj" --max-users 500 --concurrent 5
"""

import asyncio
import aiohttp
import json
import os
import sys
import sqlite3
import concurrent.futures
from pathlib import Path
from collections import deque
import time
import gc

try:
    import psutil
    PSUTIL_AVAILABLE = True
except ImportError:
    PSUTIL_AVAILABLE = False
    print("⚠️  psutil not available. Install with: pip install psutil")

# Add parent to path for imports - MUST BE BEFORE app imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
from tqdm import tqdm
from app.models.schemas import Artist, Track, RecentTrack

try:
    import orjson
except ImportError:
    import json as orjson

try:
    from aiolimiter import AsyncLimiter
except ImportError:
    AsyncLimiter = None

load_dotenv()

LASTFM_API_KEY = os.getenv("LASTFM_API_KEY")
BASE_URL = "http://ws.audioscrobbler.com/2.0/"


class PerformanceMonitor:
    """Track performance metrics for optimization"""
    def __init__(self):
        self.metrics = {
            "fetch_times": [],
            "embedding_times": [],
            "db_times": []
        }
    
    def record(self, metric_name: str, duration: float):
        if metric_name in self.metrics:
            self.metrics[metric_name].append(duration)
    
    def get_stats(self):
        stats = {}
        for name, times in self.metrics.items():
            if times:
                stats[name] = {
                    "avg": sum(times) / len(times),
                    "min": min(times),
                    "max": max(times),
                    "count": len(times)
                }
        return stats


class PersistentTagCache:
    """SQLite-backed cache for artist tags (survives restarts)"""
    def __init__(self, db_path: str = "data/artist_tags.db"):
        self.db_path = db_path
        Path(self.db_path).parent.mkdir(exist_ok=True, parents=True)
        self._init_db()
    
    def _init_db(self):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS artist_tags (
                    artist_name TEXT PRIMARY KEY,
                    tags TEXT NOT NULL
                )
            """)
            conn.commit()
    
    def get(self, artist_name: str):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute(
                "SELECT tags FROM artist_tags WHERE artist_name = ?",
                (artist_name,)
            )
            row = cursor.fetchone()
            return json.loads(row[0]) if row else None
    
    def set(self, artist_name: str, tags: list):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute(
                "INSERT OR REPLACE INTO artist_tags (artist_name, tags) VALUES (?, ?)",
                (artist_name, json.dumps(tags))
            )
            conn.commit()
    
    def count(self):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute("SELECT COUNT(*) FROM artist_tags")
            return cursor.fetchone()[0]


class MissingArtistsTracker:
    """Track artists with occurrence counts for prioritized fetching"""
    def __init__(self, json_path: str = "data/missing_artists.json", min_occurrences: int = 5):
        self.json_path = json_path
        self.min_occurrences = min_occurrences
        Path(self.json_path).parent.mkdir(exist_ok=True, parents=True)
        self.missing = self._load()

    def _load(self):
        """Load existing data, handling both old and new formats"""
        if Path(self.json_path).exists():
            with open(self.json_path, "r", encoding="utf-8") as f:
                data = json.load(f)

            # New format (dict of artists with metadata)
            if "artists" in data and isinstance(data["artists"], dict):
                return data

            # Old format (list of artists) - migrate to new format
            elif "artists" in data and isinstance(data["artists"], list):
                migrated = {"artists": {}, "summary": {}}
                for artist in data["artists"]:
                    migrated["artists"][artist] = {
                        "occurrences": 1,
                        "match_type": "unknown",
                        "first_seen": time.strftime("%Y-%m-%dT%H:%M:%S"),
                        "last_seen": time.strftime("%Y-%m-%dT%H:%M:%S")
                    }
                return migrated

        return {"artists": {}, "summary": {}}

    def add(self, artist_name: str, match_type: str = "missing"):
        """Add or increment occurrence for an artist"""
        now = time.strftime("%Y-%m-%dT%H:%M:%S")

        if artist_name in self.missing["artists"]:
            # Increment existing
            self.missing["artists"][artist_name]["occurrences"] += 1
            self.missing["artists"][artist_name]["last_seen"] = now
        else:
            # Add new
            self.missing["artists"][artist_name] = {
                "occurrences": 1,
                "match_type": match_type,
                "first_seen": now,
                "last_seen": now
            }

    def remove(self, artist_name: str):
        """Remove an artist (once successfully processed)"""
        if artist_name in self.missing["artists"]:
            del self.missing["artists"][artist_name]

    def get_sorted_by_occurrence(self, min_occurrences: int = None, limit: int = None):
        """Get artists sorted by occurrence count (descending)"""
        if min_occurrences is None:
            min_occurrences = self.min_occurrences

        # Filter by minimum occurrences
        filtered = {
            artist: data for artist, data in self.missing["artists"].items()
            if data.get("occurrences", 0) >= min_occurrences
        }

        # Sort by occurrences (descending)
        sorted_items = sorted(
            filtered.items(),
            key=lambda x: x[1].get("occurrences", 0),
            reverse=True
        )

        if limit:
            sorted_items = sorted_items[:limit]

        return sorted_items

    def get_summary(self, min_occurrences: int = None):
        """Generate summary statistics"""
        if min_occurrences is None:
            min_occurrences = self.min_occurrences

        filtered = {
            artist: data for artist, data in self.missing["artists"].items()
            if data.get("occurrences", 0) >= min_occurrences
        }

        by_match_type = {}
        for artist, data in filtered.items():
            match_type = data.get("match_type", "unknown")
            by_match_type[match_type] = by_match_type.get(match_type, 0) + 1

        top_10 = self.get_sorted_by_occurrence(min_occurrences, limit=10)

        return {
            "total_artists": len(filtered),
            "by_match_type": by_match_type,
            "top_10_by_occurrence": [
                {"artist": artist, "occurrences": data["occurrences"]}
                for artist, data in top_10
            ],
            "last_updated": time.strftime("%Y-%m-%dT%H:%M:%S")
        }

    def _save(self, min_occurrences: int = None):
        """Save only artists meeting minimum occurrence threshold"""
        if min_occurrences is None:
            min_occurrences = self.min_occurrences

        # Filter to only include artists with enough occurrences
        filtered_artists = {
            artist: data for artist, data in self.missing["artists"].items()
            if data.get("occurrences", 0) >= min_occurrences
        }

        output = {
            "artists": filtered_artists,
            "summary": self.get_summary(min_occurrences)
        }

        with open(self.json_path, "w", encoding="utf-8") as f:
            json.dump(output, f, indent=2, ensure_ascii=False)

    def get_all(self, min_occurrences: int = None):
        """Get all artists meeting minimum threshold"""
        if min_occurrences is None:
            min_occurrences = self.min_occurrences

        return [
            artist for artist, data in self.missing["artists"].items()
            if data.get("occurrences", 0) >= min_occurrences
        ]

    def count(self, min_occurrences: int = None):
        """Count artists meeting minimum threshold"""
        if min_occurrences is None:
            min_occurrences = self.min_occurrences

        return len([
            artist for artist, data in self.missing["artists"].items()
            if data.get("occurrences", 0) >= min_occurrences
        ])


class LastFmUserCrawler:
    def __init__(self, api_key: str, max_concurrent: int = 5):
        self.api_key = api_key
        self.visited_users = set()
        self.user_profiles = {}
        self.session = None
        self.max_concurrent = max_concurrent
        
        # Rate limiting
        if AsyncLimiter:
            self.rate_limiter = AsyncLimiter(20, 1)
        else:
            self.rate_limiter = None

        # ThreadPoolExecutor for embeddings
        num_cpus = os.cpu_count() or 4
        self.cpu_executor = concurrent.futures.ThreadPoolExecutor(
            max_workers=max(num_cpus - 1, 2),
            thread_name_prefix="embedding_worker"
        )
        
        # Persistent cache
        self.artist_tags_cache = PersistentTagCache()
        
        # OPTIMIZED: Reduced queue sizes with backpressure
        self.fetch_queue = asyncio.Queue(maxsize=100)
        self.process_queue = asyncio.Queue(maxsize=50)
        
        # Services
        self.embedding_service = None
        self.qdrant_service = None
        
        # Stats
        self.stats = {
            "fetched": 0,
            "processed": 0,
            "failed": 0,
            "timeouts": 0,
            "api_cache_hits": 0,
            "gpu_available": False,
            "cpu_count": num_cpus
        }
        
        # Track missing artists
        self.missing_artists_tracker = MissingArtistsTracker()
        
        # Performance monitoring
        self.perf_monitor = PerformanceMonitor()
        
        # Memory management
        self.embedding_timeout = 30  # seconds
        self.memory_threshold_mb = 2000  # 2GB
        self.gc_interval = 50  # Garbage collect every N users
        
    async def __aenter__(self):
        # Optimized TCP connector: persistent connections, DNS caching
        connector = aiohttp.TCPConnector(
            limit=0,
            ttl_dns_cache=300,
            keepalive_timeout=60,
            limit_per_host=5
        )
        self.session = aiohttp.ClientSession(connector=connector)
        
        # Import services
        from app.services.embedding import EmbeddingService
        from app.services.qdrant_service import qdrant_service
        
        self.embedding_service = EmbeddingService()
        self.qdrant_service = qdrant_service
        
        # Check GPU availability
        try:
            import torch
            self.stats["gpu_available"] = torch.cuda.is_available() or torch.backends.mps.is_available()
            if self.stats["gpu_available"]:
                device = "cuda" if torch.cuda.is_available() else "mps"
                print(f"✅ GPU detected: {device.upper()}")
        except ImportError:
            pass
        
        return self
    
    async def __aexit__(self, *args):
        if self.session:
            await self.session.close()
        if self.cpu_executor:
            # Graceful shutdown for ThreadPoolExecutor
            self.cpu_executor.shutdown(wait=True)
    
    async def _api_call(self, params: dict, max_retries: int = 3) -> dict:
        """Rate-limited API call with exponential backoff"""
        for attempt in range(max_retries):
            try:
                # Apply rate limiter if available
                if self.rate_limiter:
                    async with self.rate_limiter:
                        async with self.session.get(
                            BASE_URL, params=params, timeout=10
                        ) as resp:
                            if resp.status == 429:  # Rate limited
                                wait_time = 2 ** attempt
                                await asyncio.sleep(wait_time)
                                continue
                            if resp.status != 200:
                                return {}
                            content = await resp.read()
                            return orjson.loads(content) if isinstance(orjson, type(json)) else json.loads(content)
                else:
                    async with self.session.get(
                        BASE_URL, params=params, timeout=10
                    ) as resp:
                        if resp.status == 429:
                            await asyncio.sleep(2 ** attempt)
                            continue
                        if resp.status != 200:
                            return {}
                        return await resp.json()
                        
            except asyncio.TimeoutError:
                await asyncio.sleep(1)
            except Exception:
                return {}
        return {}
    
    async def get_user_friends(self, username: str, limit: int = 50) -> list:
        """Get users that this user follows"""
        data = await self._api_call({
            "method": "user.getFriends",
            "user": username,
            "api_key": self.api_key,
            "format": "json",
            "limit": limit
        })
        
        friends = data.get("friends", {}).get("user", [])
        if isinstance(friends, dict):
            friends = [friends]
        
        return [f.get("name") for f in friends if f.get("name")]
    
    async def get_user_top_tracks(self, username: str, limit: int = 50, period: str = "overall") -> list:
        """Get user's top tracks for a specific period"""
        data = await self._api_call({
            "method": "user.getTopTracks",
            "user": username,
            "api_key": self.api_key,
            "format": "json",
            "limit": limit,
            "period": period
        })
        
        tracks = data.get("toptracks", {}).get("track", [])
        return [
            Track(
                name=t.get("name"),
                artist=t.get("artist", {}).get("name", ""),
                playcount=int(t.get("playcount", 0))
            )
            for t in tracks if t.get("name")
        ]
    
    async def get_user_top_artists(self, username: str, limit: int = 50, period: str = "overall") -> list:
        """Get user's top artists for a specific period"""
        data = await self._api_call({
            "method": "user.getTopArtists",
            "user": username,
            "api_key": self.api_key,
            "format": "json",
            "limit": limit,
            "period": period
        })
        
        artists = data.get("topartists", {}).get("artist", [])
        return [
            Artist(name=a.get("name"), playcount=int(a.get("playcount", 0)))
            for a in artists if a.get("name")
        ]
    
    async def get_user_recent_tracks(self, username: str, limit: int = 100) -> list:
        """Get user's recent tracks"""
        data = await self._api_call({
            "method": "user.getRecentTracks",
            "user": username,
            "api_key": self.api_key,
            "format": "json",
            "limit": limit
        })
        
        tracks = data.get("recenttracks", {}).get("track", [])
        result = []
        for t in tracks:
            if not t.get("name"):
                continue
            
            nowplaying = t.get("@attr", {}).get("nowplaying") == "true"
            timestamp = None
            if not nowplaying and t.get("date"):
                timestamp = int(t["date"].get("uts", 0))
            
            result.append(RecentTrack(
                name=t.get("name"),
                artist=t.get("artist", {}).get("#text", ""),
                album=t.get("album", {}).get("#text"),
                timestamp=timestamp,
                nowplaying=nowplaying
            ))
        
        return result
    
    async def get_artist_tags_cached(self, artist_name: str, limit: int = 5) -> list:
        """Get top tags for an artist (with persistent cache)"""
        # Check persistent cache first
        cached = self.artist_tags_cache.get(artist_name)
        if cached:
            self.stats["api_cache_hits"] += 1
            return cached
        
        data = await self._api_call({
            "method": "artist.getTopTags",
            "artist": artist_name,
            "api_key": self.api_key,
            "format": "json"
        })
        
        tags = data.get("toptags", {}).get("tag", [])
        result = [t.get("name") for t in tags[:limit] if t.get("name")]
        
        # Cache result persistently
        self.artist_tags_cache.set(artist_name, result)
        return result
    
    async def get_user_info(self, username: str) -> dict:
        """Get user info including profile image and country"""
        data = await self._api_call({
            "method": "user.getInfo",
            "user": username,
            "api_key": self.api_key,
            "format": "json"
        })
        
        user = data.get("user", {})
        images = user.get("image", [])
        
        profile_image = None
        for img in reversed(images):
            if img.get("#text"):
                profile_image = img.get("#text")
                break
        
        return {
            "profile_image": profile_image,
            "country": user.get("country")
        }
    
    async def _check_user_viability(self, username: str) -> bool:
        """
        EARLY FAIL: Quick check if user has enough artists
        Avoids fetching full profile for inactive users
        """
        artists = await self.get_user_top_artists(username, limit=10)
        return len(artists) >= 5
    
    async def get_user_profile_multi_period(self, username: str) -> dict:
        """
        Fetch complete multi-period profile for a user
        ALL API calls in parallel for speed
        """
        periods = ["overall", "6month", "3month"]
        
        # Create all tasks at once
        tasks = []
        
        # Artists for each period
        for p in periods:
            tasks.append(self.get_user_top_artists(username, limit=50, period=p))
        
        # Tracks for each period  
        for p in periods:
            tasks.append(self.get_user_top_tracks(username, limit=50, period=p))
        
        # Recent tracks
        tasks.append(self.get_user_recent_tracks(username, limit=100))
        
        # User info (profile image, country)
        tasks.append(self.get_user_info(username))
        
        # Execute ALL in parallel
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Handle exceptions
        results = [r if not isinstance(r, Exception) else [] for r in results]
        
        artists_overall, artists_6month, artists_3month = results[0:3]
        tracks_overall, tracks_6month, tracks_3month = results[3:6]
        recent_tracks = results[6]
        user_info = results[7] if len(results) > 7 and isinstance(results[7], dict) else {}
        
        # Get tags for top artists (also in parallel, with cache)
        top_artists = artists_overall[:10] if artists_overall else []
        
        if top_artists:
            tag_tasks = [self.get_artist_tags_cached(a.name) for a in top_artists]
            tag_results = await asyncio.gather(*tag_tasks, return_exceptions=True)
            
            artist_tags = {}
            for artist, tags in zip(top_artists, tag_results):
                if not isinstance(tags, Exception) and tags:
                    artist_tags[artist.name] = tags
        else:
            artist_tags = {}
        
        return {
            "username": username,
            "artists": {
                "overall": artists_overall,
                "6month": artists_6month,
                "3month": artists_3month
            },
            "tracks": {
                "overall": tracks_overall,
                "6month": tracks_6month,
                "3month": tracks_3month
            },
            "recent_tracks": recent_tracks,
            "artist_tags": artist_tags,
            "profile_image": user_info.get("profile_image"),
            "country": user_info.get("country")
        }
    
    async def seed_user_directly(self, profile_data: dict) -> bool:
        """
        Seed user directly with timeout and memory management
        WITH DETAILED FAILURE LOGGING
        """
        username = profile_data.get('username', 'unknown')
        
        try:
            overall_artists = profile_data['artists'].get('overall', [])
            
            # Check 1: Minimum artists
            if len(overall_artists) < 5:
                print(f"  ❌ {username}: Only {len(overall_artists)} artists (need 5+)")
                return False

            # Generate embedding with timeout and metadata
            start_time = time.time()
            loop = asyncio.get_running_loop()

            try:
                result = await asyncio.wait_for(
                    loop.run_in_executor(
                        self.cpu_executor,
                        lambda: self.embedding_service.generate_user_embedding_temporal(
                            profile_data, return_metadata=True
                        )
                    ),
                    timeout=self.embedding_timeout
                )
                # Unpack result (embedding, metadata)
                embedding, metadata = result if isinstance(result, tuple) else (result, {})
            except asyncio.TimeoutError:
                print(f"  ❌ {username}: Embedding timeout ({self.embedding_timeout}s)")
                self.stats["timeouts"] += 1
                return False

            self.perf_monitor.record("embedding_times", time.time() - start_time)

            # Track artists by match type from metadata
            if metadata:
                # Track fuzzy matched artists
                for artist in metadata.get('artists_fuzzy', []):
                    self.missing_artists_tracker.add(artist_name=artist, match_type='fuzzy')

                # Track truly missing artists
                for artist in metadata.get('artists_missing', []):
                    self.missing_artists_tracker.add(artist_name=artist, match_type='missing')

                # Track zero-shot approximations
                for artist in metadata.get('artists_zero_shot', []):
                    self.missing_artists_tracker.add(artist_name=artist, match_type='zero_shot')

            # Check 2: Embedding generated
            if embedding is None:
                print(f"  ❌ {username}: Embedding generation returned None")
                for artist in overall_artists[:10]:
                    self.missing_artists_tracker.add(artist.name, "embedding_generation_failed")
                return False
            
            top_artist_names = [a.name for a in overall_artists[:10]]
            
            # Check 3: Genre inference
            try:
                top_genres = self.embedding_service.infer_genres_from_tags(
                    profile_data.get('artist_tags', {}),
                    top_artist_names
                )
            except Exception as e:
                print(f"  ❌ {username}: Genre inference failed: {e}")
                for artist_name in top_artist_names:
                    self.missing_artists_tracker.add(artist_name, "genre_inference_failed")
                return False
            
            # Check 4: Database insert
            try:
                start_time = time.time()
                self.qdrant_service.add_user_embedding(
                    username=username,
                    embedding=embedding.tolist(),
                    top_artists=top_artist_names,
                    is_real=False,
                    country=profile_data.get("country"),
                    profile_image=profile_data.get("profile_image"),
                    top_genres=top_genres
                )
                self.perf_monitor.record("db_times", time.time() - start_time)
            except Exception as e:
                print(f"  ❌ {username}: Database insert failed: {e}")
                return False
            
            print(f"  ✅ {username}: Seeded successfully")
            return True
            
        except Exception as e:
            print(f"  ❌ {username}: Unexpected error: {type(e).__name__}: {e}")
            try:
                for artist in profile_data.get('artists', {}).get('overall', [])[:10]:
                    self.missing_artists_tracker.add(artist.name, f"exception: {str(e)[:50]}")
            except:
                pass
            return False
    
    async def worker_crawler(self, seed_user: str, max_users: int):
        """
        PRODUCER: BFS crawl - discovers users and enqueues them
        Runs concurrently with fetchers and processors
        """
        queue = deque([seed_user])
        is_seed = True

        while queue and len(self.visited_users) < max_users:
            username = queue.popleft()

            if username in self.visited_users:
                continue

            self.visited_users.add(username)

            try:
                # Quick viability check before queuing for full fetch
                is_viable = await self._check_user_viability(username)

                if not is_viable:
                    if is_seed:
                        print(f"⚠️  Seed user '{username}' has < 5 artists or doesn't exist")
                        print("    Attempting to get friends anyway...")
                    # For seed user, try to get friends even if not viable
                    # This helps bootstrap the crawl

                if is_viable:
                    await self.fetch_queue.put(username)

                # Get friends for next frontier (even if user not viable, to continue crawl)
                friends = await self.get_user_friends(username, limit=30)

                if is_seed and not friends:
                    print(f"❌ Seed user '{username}' has no friends! Cannot continue crawl.")
                    print("   Try a different seed user with an active Last.fm profile.")
                    break

                for friend in friends:
                    if friend not in self.visited_users:
                        queue.append(friend)

                if is_seed:
                    print(f"✅ Seed user processed. Found {len(friends)} friends to explore.")
                    is_seed = False

                # Yield to event loop periodically
                await asyncio.sleep(0.01)

            except Exception as e:
                if is_seed:
                    print(f"❌ Error processing seed user '{username}': {e}")
                    print("   Check that the username is correct and the user exists on Last.fm")
                pass
    
    async def worker_fetcher(self, pbar_fetch):
        """
        CONSUMER/PRODUCER with backpressure awareness
        OPTIMIZED: Waits if process_queue is getting full
        """
        while True:
            try:
                username = await asyncio.wait_for(self.fetch_queue.get(), timeout=5)
            except asyncio.TimeoutError:
                break
            
            try:
                # Backpressure: if process_queue > 80% full, wait
                while self.process_queue.qsize() > self.process_queue.maxsize * 0.8:
                    await asyncio.sleep(0.5)
                
                start_time = time.time()
                profile_data = await self.get_user_profile_multi_period(username)
                self.perf_monitor.record("fetch_times", time.time() - start_time)
                
                if profile_data['artists'].get('overall'):
                    await self.process_queue.put(profile_data)
                    self.stats["fetched"] += 1
                    pbar_fetch.update(1)
            except Exception:
                self.stats["failed"] += 1
            finally:
                self.fetch_queue.task_done()
    
    async def worker_processor(self, pbar_process):
        """
        CONSUMER with memory management and garbage collection
        OPTIMIZED: Monitors memory and forces GC periodically
        IMPROVED: Better timeout handling with consecutive timeout tracking
        """
        processed_count = 0
        consecutive_timeouts = 0  # Track consecutive empty polls
        
        while True:
            try:
                profile_data = await asyncio.wait_for(self.process_queue.get(), timeout=2)
                consecutive_timeouts = 0  # Reset on successful get
            except asyncio.TimeoutError:
                consecutive_timeouts += 1
                # Only exit after 3 consecutive timeouts (6 seconds of no work)
                # This gives fetchers time to fill the queue
                if consecutive_timeouts >= 3:
                    break
                continue  # Try again instead of breaking immediately
            
            try:
                # Check memory every 10 users
                if PSUTIL_AVAILABLE and processed_count % 10 == 0:
                    memory_mb = psutil.Process().memory_info().rss / 1024 / 1024
                    
                    if memory_mb > self.memory_threshold_mb:
                        # Force garbage collection and pause
                        gc.collect()
                        
                        # Clear GPU memory if available
                        if self.stats.get("gpu_available"):
                            try:
                                import torch
                                if torch.cuda.is_available():
                                    torch.cuda.empty_cache()
                            except:
                                pass
                        
                        # Small pause to let system recover
                        await asyncio.sleep(0.5)
                
                if await self.seed_user_directly(profile_data):
                    self.stats["processed"] += 1
                    pbar_process.update(1)
                    processed_count += 1
                    
                    # Periodic garbage collection
                    if processed_count % self.gc_interval == 0:
                        gc.collect()
                        
            except Exception as e:
                self.stats["failed"] += 1
            finally:
                self.process_queue.task_done()
    
    async def crawl_bfs_optimized(self, seed_user: str, max_users: int = 500,
                                  num_fetchers: int = 2, num_processors: int = None):
        """
        Run producer-consumer pipeline with monitoring
        OPTIMIZED: Periodic status logging and memory monitoring
        """
        # Auto-scale processors
        if num_processors is None:
            num_processors = max(self.stats["cpu_count"] - 1, 2)
        
        # Initialize timeout stats
        self.stats["timeouts"] = 0
        
        # Monitor task for periodic logging
        async def monitor_task():
            """Log system status every 30 seconds"""
            while True:
                try:
                    await asyncio.sleep(30)
                    
                    if PSUTIL_AVAILABLE:
                        memory_mb = psutil.Process().memory_info().rss / 1024 / 1024
                    else:
                        memory_mb = 0
                    
                    cache_stats = self.embedding_service.fuzzy_cache.stats() if hasattr(self.embedding_service.fuzzy_cache, 'stats') else {}
                    
                    print(f"\n📊 Status: processed={self.stats['processed']}, "
                          f"memory={memory_mb:.0f}MB, "
                          f"fetch_q={self.fetch_queue.qsize()}, "
                          f"process_q={self.process_queue.qsize()}, "
                          f"cache_size={cache_stats.get('size', 'N/A')}, "
                          f"cache_hit_rate={cache_stats.get('hit_rate', 'N/A')}, "
                          f"timeouts={self.stats.get('timeouts', 0)}")
                except asyncio.CancelledError:
                    break
                except Exception:
                    pass
        
        monitor = asyncio.create_task(monitor_task())
        
        pbar_crawl = tqdm(total=max_users, desc="👤 Crawling", position=0)
        pbar_fetch = tqdm(total=max_users, desc="📥 Fetching", position=1)
        pbar_process = tqdm(total=max_users, desc="⚙️ Processing", position=2)
        
        # Create all workers
        crawler_task = asyncio.create_task(self.worker_crawler(seed_user, max_users))
        
        fetcher_tasks = [
            asyncio.create_task(self.worker_fetcher(pbar_fetch))
            for _ in range(num_fetchers)
        ]
        processor_tasks = [
            asyncio.create_task(self.worker_processor(pbar_process))
            for _ in range(num_processors)
        ]
        
        # Wait for crawler to finish discovery
        await crawler_task
        
        # Wait for all queues to drain
        await self.fetch_queue.join()
        await self.process_queue.join()
        
        # Cancel monitor and workers
        monitor.cancel()
        for task in fetcher_tasks + processor_tasks:
            task.cancel()
        
        pbar_crawl.update(self.stats["processed"])
        pbar_crawl.close()
        pbar_fetch.close()
        pbar_process.close()
        
        return self.stats["processed"], self.stats["failed"]


async def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="Crawl Last.fm users and seed to Qdrant")
    parser.add_argument("--seed-user", default="rj", help="Starting username (default: 'rj')")
    parser.add_argument("--max-users", type=int, default=500, help="Maximum users to seed")
    parser.add_argument("--concurrent", type=int, default=5, help="Max concurrent API calls")
    parser.add_argument("--fetchers", type=int, default=2, help="Number of fetcher workers (default: 2)")
    parser.add_argument("--processors", type=int, default=None, help="Number of processor workers (default: auto)")
    parser.add_argument("--output", default="data/lastfm_users", help="Output directory")
    args = parser.parse_args()
    
    if not LASTFM_API_KEY:
        print("❌ LASTFM_API_KEY not found in environment")
        return 1
    
    print("=" * 70)
    print("🎵 Last.fm User Crawler + Seeder (MEMORY-OPTIMIZED)")
    print("🚀 ThreadPool + FAISS + GPU + LRU Cache + Backpressure")
    print("=" * 70)
    print(f"Seed user: {args.seed_user}")
    print(f"Max users: {args.max_users}")
    print(f"Fetcher workers: {args.fetchers}")
    print(f"Processor workers: {args.processors or 'auto'}")
    print()
    
    async with LastFmUserCrawler(LASTFM_API_KEY, max_concurrent=args.concurrent) as crawler:
        initial_ghosts = crawler.qdrant_service.count_users(is_real=False)
        print(f"📊 Current ghost users: {initial_ghosts}")
        print(f"💾 Persistent tag cache entries: {crawler.artist_tags_cache.count()}")
        print(f"🖥️  CPU cores available: {crawler.stats['cpu_count']}")
        print(f"🎮 GPU available: {'✅ YES' if crawler.stats['gpu_available'] else '❌ NO'}")
        print()
        
        seeded, failed = await crawler.crawl_bfs_optimized(
            seed_user=args.seed_user,
            max_users=args.max_users,
            num_fetchers=args.fetchers,
            num_processors=args.processors
        )
        
        # Save profiles
        output_dir = Path(args.output)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        profiles_path = output_dir / "user_profiles.json"
        with open(profiles_path, "w", encoding="utf-8") as f:
            json.dump(crawler.user_profiles, f, indent=2, ensure_ascii=False)
        
        final_ghosts = crawler.qdrant_service.count_users(is_real=False)
        
        # Print performance stats
        perf_stats = crawler.perf_monitor.get_stats()
        cache_stats = crawler.embedding_service.fuzzy_cache.stats() if hasattr(crawler.embedding_service.fuzzy_cache, 'stats') else {}
        
        print()
        print("=" * 70)
        print("✅ Complete!")
        print("=" * 70)
        print(f"Users seeded: {seeded}")
        print(f"Users failed: {failed}")
        print(f"Total ghost users now: {final_ghosts}")
        print(f"API cache hits: {crawler.stats['api_cache_hits']}")
        print(f"Total tag cache entries: {crawler.artist_tags_cache.count()}")
        print(f"Missing artists tracked: {crawler.missing_artists_tracker.count()}")
        print(f"Embedding timeouts: {crawler.stats['timeouts']}")

        # Print top missing artists by occurrence (only 5+ occurrences)
        top_missing = crawler.missing_artists_tracker.get_sorted_by_occurrence(
            min_occurrences=5, limit=20
        )
        if top_missing:
            print()
            print("📊 Top Missing Artists by Occurrence (5+ users):")
            for i, (artist, data) in enumerate(top_missing, 1):
                print(f"  {i:2d}. {artist[:40]:<40} | "
                      f"Count: {data['occurrences']:3d} | "
                      f"Type: {data['match_type']}")

            # Print breakdown by match type (only 5+)
            summary = crawler.missing_artists_tracker.get_summary(min_occurrences=5)
            print()
            print("📊 Missing Artists Breakdown (5+ users):")
            for match_type, count in summary['by_match_type'].items():
                print(f"  ├─ {match_type}: {count}")
            print()
            print(f"💾 Saved {summary['total_artists']} artists to data/missing_artists.json (filtered to 5+ occurrences)")

            # Save the data
            crawler.missing_artists_tracker._save(min_occurrences=5)

        if cache_stats:
            print()
            print("💾 Cache Statistics:")
            print(f"  ├─ Size: {cache_stats.get('size', 'N/A')}/{cache_stats.get('max_size', 'N/A')}")
            print(f"  ├─ Hit rate: {cache_stats.get('hit_rate', 'N/A')}")
            print(f"  ├─ Hits: {cache_stats.get('hits', 0)}")
            print(f"  └─ Misses: {cache_stats.get('misses', 0)}")
        
        if perf_stats:
            print()
            print("⏱️  Performance Metrics:")
            for metric, stats in perf_stats.items():
                print(f"  {metric}:")
                print(f"    ├─ Avg: {stats['avg']:.2f}s")
                print(f"    ├─ Min: {stats['min']:.2f}s")
                print(f"    ├─ Max: {stats['max']:.2f}s")
                print(f"    └─ Count: {stats['count']}")
    
    return 0


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    exit(exit_code)