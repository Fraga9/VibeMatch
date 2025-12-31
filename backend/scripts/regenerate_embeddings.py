"""
Regenerate embeddings for existing users after model retraining (FIXED VERSION)

Fixes from v1:
- Proper rate limiting with semaphore (5 concurrent max)
- Retry logic for rate-limited requests
- Distinguishes API failures from users with no data
- No verbose timing output per user
- Progress shows meaningful stats

Usage:
    python scripts/regenerate_embeddings.py --batch-size 50 --dry-run
    python scripts/regenerate_embeddings.py --batch-size 100
    python scripts/regenerate_embeddings.py --username "specific_user"  # Single user test
"""

import asyncio
import aiohttp
import json
import os
import sys
import time
import gc
from pathlib import Path
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Tuple
from collections import defaultdict
from datetime import datetime
from enum import Enum

# Add parent to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
from tqdm import tqdm

load_dotenv()

LASTFM_API_KEY = os.getenv("LASTFM_API_KEY")
BASE_URL = "http://ws.audioscrobbler.com/2.0/"


class FetchResult(Enum):
    """Distinguish between different failure modes"""
    SUCCESS = "success"
    API_ERROR = "api_error"          # Last.fm returned error/timeout
    RATE_LIMITED = "rate_limited"    # 429 response
    NO_DATA = "no_data"              # User exists but has < 5 artists
    USER_NOT_FOUND = "user_not_found"  # User doesn't exist on Last.fm


@dataclass
class MatchStats:
    """Track embedding match statistics across all users"""
    # Per-type counters
    artists_exact: int = 0
    artists_fuzzy: int = 0
    artists_zero_shot: int = 0
    artists_missing: int = 0
    tracks_exact: int = 0
    tracks_fuzzy: int = 0
    tracks_zero_shot: int = 0
    tracks_missing: int = 0
    
    # Lists for detailed reporting
    fuzzy_artists: Dict[str, int] = field(default_factory=lambda: defaultdict(int))
    missing_artists: Dict[str, int] = field(default_factory=lambda: defaultdict(int))
    zero_shot_artists: Dict[str, int] = field(default_factory=lambda: defaultdict(int))
    
    # User-level stats (more granular)
    users_processed: int = 0
    users_api_error: int = 0
    users_rate_limited: int = 0
    users_no_data: int = 0
    users_not_found: int = 0
    users_embedding_failed: int = 0
    
    # Quality grades
    grades: Dict[str, int] = field(default_factory=lambda: defaultdict(int))
    
    def add_user_stats(self, metadata: dict, username: str):
        """Add stats from a single user's embedding generation"""
        counts = metadata.get('counts', {})
        
        # Aggregate counts
        self.artists_exact += counts.get('artists_exact', 0)
        self.artists_fuzzy += counts.get('artists_fuzzy', 0)
        self.artists_zero_shot += counts.get('artists_zero_shot', 0)
        self.artists_missing += counts.get('artists_missing', 0)
        self.tracks_exact += counts.get('tracks_exact', 0)
        self.tracks_fuzzy += counts.get('tracks_fuzzy', 0)
        self.tracks_zero_shot += counts.get('tracks_zero_shot', 0)
        self.tracks_missing += counts.get('tracks_missing', 0)
        
        # Track individual artists
        for artist in metadata.get('artists_fuzzy', []):
            self.fuzzy_artists[artist] += 1
        for artist in metadata.get('artists_missing', []):
            self.missing_artists[artist] += 1
        for artist in metadata.get('artists_zero_shot', []):
            self.zero_shot_artists[artist] += 1
        
        # Calculate quality grade for this user
        grade = self._calculate_grade(counts)
        self.grades[grade] += 1
        self.users_processed += 1
    
    def _calculate_grade(self, counts: dict) -> str:
        """Calculate quality grade based on match types"""
        total_artists = sum([
            counts.get('artists_exact', 0),
            counts.get('artists_fuzzy', 0),
            counts.get('artists_zero_shot', 0),
            counts.get('artists_missing', 0)
        ])
        
        if total_artists == 0:
            return 'F'
        
        # Weighted score: exact=1.0, fuzzy=0.5, zero_shot=0.3, missing=0
        confidence = (
            counts.get('artists_exact', 0) * 1.0 +
            counts.get('artists_fuzzy', 0) * 0.5 +
            counts.get('artists_zero_shot', 0) * 0.3
        ) / total_artists
        
        if confidence > 0.8:
            return 'A'
        elif confidence > 0.6:
            return 'B'
        elif confidence > 0.4:
            return 'C'
        elif confidence > 0.2:
            return 'D'
        return 'F'
    
    def print_summary(self):
        """Print comprehensive summary"""
        print("\n" + "=" * 70)
        print("📊 EMBEDDING REGENERATION SUMMARY")
        print("=" * 70)
        
        # User stats - more detailed breakdown
        total_attempted = (
            self.users_processed + 
            self.users_api_error + 
            self.users_rate_limited + 
            self.users_no_data + 
            self.users_not_found +
            self.users_embedding_failed
        )
        
        print(f"\n👥 Users ({total_attempted} attempted):")
        print(f"  ├─ ✅ Processed:        {self.users_processed:5d}")
        print(f"  ├─ ⚠️  No data (<5 artists): {self.users_no_data:5d}")
        print(f"  ├─ 🚫 API errors:       {self.users_api_error:5d}")
        print(f"  ├─ ⏳ Rate limited:     {self.users_rate_limited:5d}")
        print(f"  ├─ ❓ Not found:        {self.users_not_found:5d}")
        print(f"  └─ 💥 Embedding failed: {self.users_embedding_failed:5d}")
        
        if total_attempted > 0:
            success_rate = self.users_processed / total_attempted * 100
            print(f"\n  Success rate: {success_rate:.1f}%")
        
        # Artist match breakdown
        total_artists = self.artists_exact + self.artists_fuzzy + self.artists_zero_shot + self.artists_missing
        print(f"\n🎤 Artist Matches (total: {total_artists}):")
        if total_artists > 0:
            print(f"  ├─ Exact:     {self.artists_exact:6d} ({self.artists_exact/total_artists*100:5.1f}%) ✅")
            print(f"  ├─ Fuzzy:     {self.artists_fuzzy:6d} ({self.artists_fuzzy/total_artists*100:5.1f}%) ⚠️")
            print(f"  ├─ Zero-shot: {self.artists_zero_shot:6d} ({self.artists_zero_shot/total_artists*100:5.1f}%) 🔮")
            print(f"  └─ Missing:   {self.artists_missing:6d} ({self.artists_missing/total_artists*100:5.1f}%) ❌")
        
        # Track match breakdown
        total_tracks = self.tracks_exact + self.tracks_fuzzy + self.tracks_zero_shot + self.tracks_missing
        print(f"\n🎵 Track Matches (total: {total_tracks}):")
        if total_tracks > 0:
            print(f"  ├─ Exact:     {self.tracks_exact:6d} ({self.tracks_exact/total_tracks*100:5.1f}%) ✅")
            print(f"  ├─ Fuzzy:     {self.tracks_fuzzy:6d} ({self.tracks_fuzzy/total_tracks*100:5.1f}%) ⚠️")
            print(f"  ├─ Zero-shot: {self.tracks_zero_shot:6d} ({self.tracks_zero_shot/total_tracks*100:5.1f}%) 🔮")
            print(f"  └─ Missing:   {self.tracks_missing:6d} ({self.tracks_missing/total_tracks*100:5.1f}%) ❌")
        
        # Quality grades distribution
        if self.users_processed > 0:
            print(f"\n📈 Quality Grade Distribution:")
            grade_order = ['A', 'B', 'C', 'D', 'F']
            grade_emojis = {'A': '🌟', 'B': '✅', 'C': '⚠️', 'D': '😟', 'F': '❌'}
            for grade in grade_order:
                count = self.grades.get(grade, 0)
                pct = count / self.users_processed * 100
                bar = '█' * int(pct / 5) + '░' * (20 - int(pct / 5))
                print(f"  {grade_emojis[grade]} Grade {grade}: {bar} {count:4d} ({pct:5.1f}%)")
        
        # Top problematic artists
        if self.missing_artists:
            print(f"\n❌ Top 15 Missing Artists (not in model):")
            sorted_missing = sorted(self.missing_artists.items(), key=lambda x: x[1], reverse=True)[:15]
            for i, (artist, count) in enumerate(sorted_missing, 1):
                print(f"  {i:2d}. {artist[:45]:<45} | {count:3d} users")
        
        if self.fuzzy_artists:
            print(f"\n⚠️  Top 15 Fuzzy-Matched Artists (potential mismatches):")
            sorted_fuzzy = sorted(self.fuzzy_artists.items(), key=lambda x: x[1], reverse=True)[:15]
            for i, (artist, count) in enumerate(sorted_fuzzy, 1):
                print(f"  {i:2d}. {artist[:45]:<45} | {count:3d} users")
        
        if self.zero_shot_artists:
            print(f"\n🔮 Top 15 Zero-Shot Artists (approximated embeddings):")
            sorted_zs = sorted(self.zero_shot_artists.items(), key=lambda x: x[1], reverse=True)[:15]
            for i, (artist, count) in enumerate(sorted_zs, 1):
                print(f"  {i:2d}. {artist[:45]:<45} | {count:3d} users")
        
        print("\n" + "=" * 70)
    
    def save_report(self, output_path: str = "data/regeneration_report.json"):
        """Save detailed report to JSON"""
        report = {
            "generated_at": datetime.utcnow().isoformat(),
            "summary": {
                "users_processed": self.users_processed,
                "users_api_error": self.users_api_error,
                "users_rate_limited": self.users_rate_limited,
                "users_no_data": self.users_no_data,
                "users_not_found": self.users_not_found,
                "users_embedding_failed": self.users_embedding_failed,
            },
            "artist_matches": {
                "exact": self.artists_exact,
                "fuzzy": self.artists_fuzzy,
                "zero_shot": self.artists_zero_shot,
                "missing": self.artists_missing,
            },
            "track_matches": {
                "exact": self.tracks_exact,
                "fuzzy": self.tracks_fuzzy,
                "zero_shot": self.tracks_zero_shot,
                "missing": self.tracks_missing,
            },
            "quality_grades": dict(self.grades),
            "problematic_artists": {
                "missing": dict(sorted(self.missing_artists.items(), key=lambda x: x[1], reverse=True)[:100]),
                "fuzzy": dict(sorted(self.fuzzy_artists.items(), key=lambda x: x[1], reverse=True)[:100]),
                "zero_shot": dict(sorted(self.zero_shot_artists.items(), key=lambda x: x[1], reverse=True)[:100]),
            }
        }
        
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        print(f"\n💾 Detailed report saved to: {output_path}")


class EmbeddingRegenerator:
    """Regenerate embeddings for existing users - FIXED VERSION"""

    # Rate limiting constants (Last.fm allows 5 req/s averaged over 5 min)
    # Each user = 7 parallel requests, so ~1.5s between users keeps us safe
    MAX_CONCURRENT_USERS = 1       # Sequential to avoid bursts
    MAX_RETRIES = 3
    DELAY_BETWEEN_USERS = 0.8      # 7 reqs + 1s delay ≈ 4-5 req/s (safe margin)
    DELAY_BETWEEN_BATCHES = 5      # Short pause between batches
    DEFAULT_BATCH_SIZE = 100
    
    def __init__(self, api_key: str, verbose: bool = False):
        self.api_key = api_key
        self.session = None
        self.embedding_service = None
        self.qdrant_service = None
        self.stats = MatchStats()
        self.verbose = verbose
        
        # Semaphore for limiting concurrent users
        self._user_semaphore = None
        
    async def __aenter__(self):
        # Create session with connection pooling
        connector = aiohttp.TCPConnector(limit=100, ttl_dns_cache=300)
        timeout = aiohttp.ClientTimeout(total=30, connect=10)
        self.session = aiohttp.ClientSession(connector=connector, timeout=timeout)
        
        # Semaphore limits concurrent USERS, not requests
        self._user_semaphore = asyncio.Semaphore(self.MAX_CONCURRENT_USERS)
        
        # Import services (suppress verbose output)
        import logging
        logging.getLogger('app.services.embedding').setLevel(logging.WARNING)
        
        from app.services.embedding import EmbeddingService
        from app.services.qdrant_service import qdrant_service
        
        self.embedding_service = EmbeddingService()
        self.qdrant_service = qdrant_service
        
        return self
    
    async def __aexit__(self, *args):
        if self.session:
            await self.session.close()
    
    async def _api_call(self, params: dict) -> Tuple[dict, FetchResult]:
        """
        Single API call with retry logic. NO rate limiting here - 
        rate limiting is done at the user level.
        """
        for attempt in range(self.MAX_RETRIES):
            try:
                async with self.session.get(BASE_URL, params=params) as resp:
                    # Rate limited
                    if resp.status == 429:
                        wait_time = 2 ** attempt + 1
                        if self.verbose:
                            print(f"  ⏳ Rate limited, waiting {wait_time}s...")
                        await asyncio.sleep(wait_time)
                        continue
                    
                    # User not found
                    if resp.status == 404:
                        return {}, FetchResult.USER_NOT_FOUND
                    
                    # Other error
                    if resp.status != 200:
                        if attempt < self.MAX_RETRIES - 1:
                            await asyncio.sleep(0.5)
                            continue
                        return {}, FetchResult.API_ERROR
                    
                    data = await resp.json()
                    
                    # Check for Last.fm error response
                    if "error" in data:
                        error_code = data.get("error")
                        if error_code == 6:  # User not found
                            return {}, FetchResult.USER_NOT_FOUND
                        return {}, FetchResult.API_ERROR
                    
                    return data, FetchResult.SUCCESS
                    
            except asyncio.TimeoutError:
                if attempt < self.MAX_RETRIES - 1:
                    await asyncio.sleep(0.5)
                    continue
                return {}, FetchResult.API_ERROR
            except Exception as e:
                if self.verbose:
                    print(f"  ❌ API error: {e}")
                return {}, FetchResult.API_ERROR
        
        return {}, FetchResult.RATE_LIMITED
    
    async def fetch_user_profile(self, username: str) -> Tuple[Optional[dict], FetchResult]:
        """
        Fetch complete user profile from Last.fm.
        All 7 requests go in PARALLEL (they're for the same user).
        Returns (profile_data, result_type) tuple.
        """
        from app.models.schemas import Artist, Track, RecentTrack
        
        periods = ["overall", "6month", "3month"]
        
        # Create all tasks at once - parallel requests for this user
        tasks = []
        
        # Artists per period (3 requests)
        for p in periods:
            tasks.append(self._api_call({
                "method": "user.getTopArtists",
                "user": username,
                "api_key": self.api_key,
                "format": "json",
                "limit": 50,
                "period": p
            }))
        
        # Tracks per period (3 requests)
        for p in periods:
            tasks.append(self._api_call({
                "method": "user.getTopTracks",
                "user": username,
                "api_key": self.api_key,
                "format": "json",
                "limit": 50,
                "period": p
            }))
        
        # Recent tracks (1 request)
        tasks.append(self._api_call({
            "method": "user.getRecentTracks",
            "user": username,
            "api_key": self.api_key,
            "format": "json",
            "limit": 100
        }))
        
        # Execute ALL 7 requests in parallel
        results = await asyncio.gather(*tasks)
        
        # Check if user exists (based on first response)
        if results[0][1] == FetchResult.USER_NOT_FOUND:
            return None, FetchResult.USER_NOT_FOUND
        
        # Check for rate limiting or API errors
        error_count = sum(1 for _, result in results if result != FetchResult.SUCCESS)
        if error_count > 3:  # More than half failed
            # Determine most common error
            if any(r[1] == FetchResult.RATE_LIMITED for r in results):
                return None, FetchResult.RATE_LIMITED
            return None, FetchResult.API_ERROR
        
        # Parse results
        def parse_artists(data_tuple):
            data, result = data_tuple
            if not data or result != FetchResult.SUCCESS:
                return []
            artists = data.get("topartists", {}).get("artist", [])
            return [
                Artist(name=a.get("name"), playcount=int(a.get("playcount", 0)))
                for a in artists if a.get("name")
            ]
        
        def parse_tracks(data_tuple):
            data, result = data_tuple
            if not data or result != FetchResult.SUCCESS:
                return []
            tracks = data.get("toptracks", {}).get("track", [])
            return [
                Track(
                    name=t.get("name"),
                    artist=t.get("artist", {}).get("name", ""),
                    playcount=int(t.get("playcount", 0))
                )
                for t in tracks if t.get("name")
            ]
        
        def parse_recent(data_tuple):
            data, result = data_tuple
            if not data or result != FetchResult.SUCCESS:
                return []
            tracks = data.get("recenttracks", {}).get("track", [])
            parsed = []
            for t in tracks:
                if not t.get("name"):
                    continue
                nowplaying = t.get("@attr", {}).get("nowplaying") == "true"
                timestamp = None
                if not nowplaying and t.get("date"):
                    timestamp = int(t["date"].get("uts", 0))
                parsed.append(RecentTrack(
                    name=t.get("name"),
                    artist=t.get("artist", {}).get("#text", ""),
                    album=t.get("album", {}).get("#text"),
                    timestamp=timestamp,
                    nowplaying=nowplaying
                ))
            return parsed
        
        artists_by_period = {
            "overall": parse_artists(results[0]),
            "6month": parse_artists(results[1]),
            "3month": parse_artists(results[2])
        }
        
        tracks_by_period = {
            "overall": parse_tracks(results[3]),
            "6month": parse_tracks(results[4]),
            "3month": parse_tracks(results[5])
        }
        
        recent_tracks = parse_recent(results[6])
        
        # Check if user has enough data
        if len(artists_by_period["overall"]) < 5:
            return None, FetchResult.NO_DATA
        
        return {
            "username": username,
            "artists": artists_by_period,
            "tracks": tracks_by_period,
            "recent_tracks": recent_tracks,
            "artist_tags": {}
        }, FetchResult.SUCCESS
    
    def get_all_users(self) -> List[dict]:
        """Get all users from Qdrant"""
        all_users = []
        offset = None
        
        while True:
            result = self.qdrant_service.client.scroll(
                collection_name=self.qdrant_service.collection_name,
                limit=100,
                offset=offset,
                with_payload=True,
                with_vectors=False
            )
            
            points, next_offset = result
            
            for point in points:
                all_users.append({
                    "user_id": str(point.id),
                    "username": point.payload.get("username"),
                    "is_real": point.payload.get("is_real", True),
                    "country": point.payload.get("country"),
                    "profile_image": point.payload.get("profile_image"),
                    "top_genres": point.payload.get("top_genres", [])
                })
            
            if next_offset is None:
                break
            offset = next_offset
        
        return all_users
    
    async def regenerate_user(self, user: dict, dry_run: bool = False) -> bool:
        """Regenerate embedding for a single user (with concurrency control)"""
        username = user["username"]
        
        # Semaphore limits how many users are processed concurrently
        async with self._user_semaphore:
            try:
                # Fetch fresh profile from Last.fm (7 parallel requests)
                profile_data, fetch_result = await self.fetch_user_profile(username)
                
                # Handle different failure modes
                if fetch_result == FetchResult.USER_NOT_FOUND:
                    self.stats.users_not_found += 1
                    return False
                elif fetch_result == FetchResult.RATE_LIMITED:
                    self.stats.users_rate_limited += 1
                    return False
                elif fetch_result == FetchResult.API_ERROR:
                    self.stats.users_api_error += 1
                    return False
                elif fetch_result == FetchResult.NO_DATA:
                    self.stats.users_no_data += 1
                    return False
                
                # Generate embedding with metadata (suppress timing output)
                embedding, metadata = self.embedding_service.generate_user_embedding_temporal(
                    profile_data, return_metadata=True
                )
                
                if embedding is None:
                    self.stats.users_embedding_failed += 1
                    return False
                
                # Track stats
                self.stats.add_user_stats(metadata, username)
                
                if not dry_run:
                    # Get top artists for payload
                    top_artists = [a.name for a in profile_data["artists"]["overall"][:10]]
                    
                    # Infer genres
                    top_genres = self.embedding_service.infer_genres_from_tags(
                        profile_data.get("artist_tags", {}),
                        top_artists
                    )
                    
                    # Update in Qdrant
                    self.qdrant_service.add_user_embedding(
                        username=username,
                        embedding=embedding.tolist(),
                        top_artists=top_artists,
                        is_real=user.get("is_real", True),
                        country=user.get("country"),
                        profile_image=user.get("profile_image"),
                        top_genres=top_genres
                    )
                
                return True
                
            except Exception as e:
                if self.verbose:
                    print(f"  ❌ {username}: {type(e).__name__}: {e}")
                self.stats.users_embedding_failed += 1
                return False
    
    async def regenerate_all(
        self,
        batch_size: int = 50,
        dry_run: bool = False,
        filter_real: Optional[bool] = None,
        single_user: Optional[str] = None
    ):
        """Regenerate embeddings for all users"""
        
        if single_user:
            # Test mode: single user (verbose)
            self.verbose = True
            print(f"\n🔍 Testing single user: {single_user}")
            user = self.qdrant_service.get_user_by_username(single_user)
            if not user:
                print(f"❌ User '{single_user}' not found in database")
                return
            
            success = await self.regenerate_user({
                "username": single_user,
                "user_id": user.get("user_id"),
                "is_real": user.get("is_real", True),
                "country": user.get("country"),
                "profile_image": user.get("profile_image")
            }, dry_run=dry_run)
            
            if success:
                print(f"✅ Successfully regenerated embedding for {single_user}")
            
            self.stats.print_summary()
            return
        
        # Get all users
        print("📥 Fetching users from Qdrant...")
        all_users = self.get_all_users()
        
        # Filter if needed
        if filter_real is not None:
            all_users = [u for u in all_users if u.get("is_real") == filter_real]
        
        total_users = len(all_users)
        print(f"📊 Found {total_users} users to process")
        
        if dry_run:
            print("🔍 DRY RUN MODE - No changes will be saved")
        
        print(f"⚡ Rate limiting: {self.DELAY_BETWEEN_USERS}s between users, {self.DELAY_BETWEEN_BATCHES}s between batches")
        print(f"📦 Batch size: {batch_size} users")
        print()
        
        # Progress tracking
        pbar = tqdm(total=total_users, desc="Regenerating")
        completed = 0
        
        async def process_and_update(user):
            nonlocal completed
            result = await self.regenerate_user(user, dry_run=dry_run)
            completed += 1
            pbar.update(1)
            pbar.set_postfix({
                'ok': self.stats.users_processed,
                'err': self.stats.users_api_error,
                'nodata': self.stats.users_no_data
            })
            return result
        
        # Process in batches with delays to avoid rate limiting
        for batch_num, i in enumerate(range(0, total_users, batch_size)):
            batch = all_users[i:i + batch_size]
            batch_end = min(i + batch_size, total_users)

            if batch_num > 0:
                # Pause between batches to let rate limits reset
                pbar.set_description(f"⏳ Pausing {self.DELAY_BETWEEN_BATCHES}s")
                await asyncio.sleep(self.DELAY_BETWEEN_BATCHES)
                pbar.set_description("Regenerating")

            # Process users sequentially with delay between each
            for user in batch:
                await process_and_update(user)
                await asyncio.sleep(self.DELAY_BETWEEN_USERS)

            # Garbage collect between batches
            gc.collect()

            # Show batch progress
            print(f"\n📦 Batch {batch_num + 1} complete ({batch_end}/{total_users} users)")
        
        pbar.close()
        
        # Print and save summary
        self.stats.print_summary()
        self.stats.save_report()


async def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="Regenerate user embeddings after model retraining")
    parser.add_argument("--batch-size", type=int, default=100, help="Users per batch before pausing (default: 100)")
    parser.add_argument("--dry-run", action="store_true", help="Don't save changes, just compute stats")
    parser.add_argument("--real-only", action="store_true", help="Only process real users (not ghosts)")
    parser.add_argument("--ghost-only", action="store_true", help="Only process ghost users")
    parser.add_argument("--username", type=str, help="Regenerate single user (test mode)")
    parser.add_argument("--verbose", "-v", action="store_true", help="Verbose output")
    args = parser.parse_args()
    
    if not LASTFM_API_KEY:
        print("❌ LASTFM_API_KEY not found in environment")
        return 1
    
    print("=" * 70)
    print("🔄 EMBEDDING REGENERATION TOOL (v2 - Fixed)")
    print("=" * 70)
    print(f"Dry run: {args.dry_run}")
    print()
    
    filter_real = None
    if args.real_only:
        filter_real = True
        print("📌 Filtering: Real users only")
    elif args.ghost_only:
        filter_real = False
        print("📌 Filtering: Ghost users only")
    
    async with EmbeddingRegenerator(LASTFM_API_KEY, verbose=args.verbose) as regenerator:
        # Print current stats
        total = regenerator.qdrant_service.count_users()
        real = regenerator.qdrant_service.count_users(is_real=True)
        ghost = regenerator.qdrant_service.count_users(is_real=False)
        
        print(f"📊 Current database:")
        print(f"  ├─ Total users: {total}")
        print(f"  ├─ Real users:  {real}")
        print(f"  └─ Ghost users: {ghost}")
        print()
        
        await regenerator.regenerate_all(
            batch_size=args.batch_size,
            dry_run=args.dry_run,
            filter_real=filter_real,
            single_user=args.username
        )
    
    return 0


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    exit(exit_code)