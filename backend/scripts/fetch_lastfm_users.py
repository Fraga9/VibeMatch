"""
Fetch Last.fm users via social graph traversal (BFS) and seed them directly

Usage:
    python fetch_lastfm_users.py --seed-user "Fraga9" --max-users 250
    python fetch_lastfm_users.py --seed-user "rj" --max-users 500 --concurrent 5
"""

import asyncio
import aiohttp
import json
import os
import sys
from pathlib import Path
from collections import deque

# Add parent to path for imports - MUST BE BEFORE app imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
from tqdm import tqdm
from app.models.schemas import Artist, Track, RecentTrack

load_dotenv()

LASTFM_API_KEY = os.getenv("LASTFM_API_KEY")
BASE_URL = "http://ws.audioscrobbler.com/2.0/"


class LastFmUserCrawler:
    def __init__(self, api_key: str, max_concurrent: int = 5):
        self.api_key = api_key
        self.visited_users = set()
        self.user_profiles = {}
        self.session = None
        self.max_concurrent = max_concurrent
        
        # Semaphore to limit concurrent API calls
        self.semaphore = asyncio.Semaphore(max_concurrent)
        
        # Cache for artist tags (avoid duplicate fetches)
        self.artist_tags_cache = {}
        
        # Import services for direct seeding
        self.embedding_service = None
        self.qdrant_service = None
        
    async def __aenter__(self):
        # Use connection pooling
        connector = aiohttp.TCPConnector(limit=self.max_concurrent * 2)
        self.session = aiohttp.ClientSession(connector=connector)
        
        # Import services
        from app.services.embedding import EmbeddingService
        from app.services.qdrant_service import qdrant_service
        
        self.embedding_service = EmbeddingService()
        self.qdrant_service = qdrant_service
        
        return self
    
    async def __aexit__(self, *args):
        if self.session:
            await self.session.close()
    
    async def _api_call(self, params: dict) -> dict:
        """Rate-limited API call with retry"""
        async with self.semaphore:
            for attempt in range(3):
                try:
                    async with self.session.get(BASE_URL, params=params, timeout=10) as resp:
                        if resp.status == 429:  # Rate limited
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
        """Get top tags for an artist (with cache)"""
        # Check cache first
        if artist_name in self.artist_tags_cache:
            return self.artist_tags_cache[artist_name]
        
        data = await self._api_call({
            "method": "artist.getTopTags",
            "artist": artist_name,
            "api_key": self.api_key,
            "format": "json"
        })
        
        tags = data.get("toptags", {}).get("tag", [])
        result = [t.get("name") for t in tags[:limit] if t.get("name")]
        
        # Cache result
        self.artist_tags_cache[artist_name] = result
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
        
        # Get largest image (usually last in array)
        profile_image = None
        for img in reversed(images):
            if img.get("#text"):
                profile_image = img.get("#text")
                break
        
        return {
            "profile_image": profile_image,
            "country": user.get("country")
        }
    
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
    
    async def seed_user_directly(self, username: str) -> bool:
        """Seed user directly using embedding service with multi-period data"""
        try:
            profile_data = await self.get_user_profile_multi_period(username)
            
            overall_artists = profile_data['artists'].get('overall', [])
            if len(overall_artists) < 5:
                return False
            
            embedding = self.embedding_service.generate_user_embedding_temporal(profile_data)
            
            if embedding is None:
                return False
            
            top_artist_names = [a.name for a in overall_artists[:10]]
            
            top_genres = self.embedding_service.infer_genres_from_tags(
                profile_data.get('artist_tags', {}),
                top_artist_names
            )
            
            self.qdrant_service.add_user_embedding(
                username=username,
                embedding=embedding.tolist(),
                top_artists=top_artist_names,
                is_real=False,
                country=profile_data.get("country"),
                profile_image=profile_data.get("profile_image"),
                top_genres=top_genres
            )
            
            return True
            
        except Exception as e:
            return False
    
    async def process_user_batch(self, usernames: list) -> tuple:
        """Process a batch of users concurrently"""
        tasks = [self.seed_user_directly(u) for u in usernames]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        seeded = sum(1 for r in results if r is True)
        skipped = len(results) - seeded
        
        return seeded, skipped
        
    async def crawl_bfs(self, seed_user: str, max_users: int = 500, 
                        min_artists: int = 5, batch_size: int = 10):
        """
        BFS crawl with batch processing for speed
        """
        queue = deque([seed_user])
        pbar = tqdm(total=max_users, desc="Crawling & seeding")
        seeded_count = 0
        skipped_count = 0
        
        while queue and seeded_count < max_users:
            # Get batch of users to process
            batch = []
            while queue and len(batch) < batch_size:
                username = queue.popleft()
                if username not in self.visited_users:
                    self.visited_users.add(username)
                    batch.append(username)
            
            if not batch:
                break
            
            # Process batch concurrently
            seeded, skipped = await self.process_user_batch(batch)
            seeded_count += seeded
            skipped_count += skipped
            
            pbar.update(seeded)
            pbar.set_postfix({
                "seeded": seeded_count,
                "skipped": skipped_count,
                "queue": len(queue)
            })
            
            # Record seeded users
            for username in batch:
                self.user_profiles[username] = {"seeded": True}
            
            # Get friends from all seeded users (in parallel)
            friend_tasks = [self.get_user_friends(u, limit=20) for u in batch]
            friend_results = await asyncio.gather(*friend_tasks, return_exceptions=True)
            
            for friends in friend_results:
                if isinstance(friends, list):
                    for friend in friends:
                        if friend not in self.visited_users:
                            queue.append(friend)
            
            # Small delay between batches to avoid rate limits
            await asyncio.sleep(0.2)
        
        pbar.close()
        
        return seeded_count, skipped_count


async def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="Crawl Last.fm users and seed to Qdrant")
    parser.add_argument("--seed-user", default="rj", help="Starting username (default: 'rj')")
    parser.add_argument("--max-users", type=int, default=500, help="Maximum users to seed")
    parser.add_argument("--concurrent", type=int, default=5, help="Max concurrent API calls")
    parser.add_argument("--batch-size", type=int, default=10, help="Users to process per batch")
    parser.add_argument("--output", default="data/lastfm_users", help="Output directory")
    args = parser.parse_args()
    
    if not LASTFM_API_KEY:
        print("❌ LASTFM_API_KEY not found in environment")
        return 1
    
    print("=" * 60)
    print("🎵 Last.fm User Crawler + Seeder (FAST MODE)")
    print("=" * 60)
    print(f"Seed user: {args.seed_user}")
    print(f"Max users: {args.max_users}")
    print(f"Concurrent API calls: {args.concurrent}")
    print(f"Batch size: {args.batch_size}")
    print()
    
    async with LastFmUserCrawler(LASTFM_API_KEY, max_concurrent=args.concurrent) as crawler:
        initial_ghosts = crawler.qdrant_service.count_users(is_real=False)
        print(f"📊 Current ghost users: {initial_ghosts}")
        print()
        
        seeded, skipped = await crawler.crawl_bfs(
            seed_user=args.seed_user,
            max_users=args.max_users,
            batch_size=args.batch_size
        )
        
        # Save profiles
        output_dir = Path(args.output)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        profiles_path = output_dir / "user_profiles.json"
        with open(profiles_path, "w", encoding="utf-8") as f:
            json.dump(crawler.user_profiles, f, indent=2, ensure_ascii=False)
        
        final_ghosts = crawler.qdrant_service.count_users(is_real=False)
        
        print()
        print("=" * 60)
        print("✅ Complete!")
        print("=" * 60)
        print(f"Users seeded: {seeded}")
        print(f"Users skipped: {skipped}")
        print(f"Total ghost users now: {final_ghosts}")
        print(f"Artist tags cached: {len(crawler.artist_tags_cache)}")
    
    return 0


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    exit(exit_code)