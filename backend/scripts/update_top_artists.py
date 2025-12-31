"""
Update top_artists payload for existing users (NO embedding regeneration)

This script only updates the top_artists field in Qdrant from 10 to 30 artists.
It does NOT regenerate embeddings - only fetches fresh artist data from Last.fm.

Much faster than regenerate_embeddings.py because:
- Only 1 API call per user (vs 7)
- No embedding computation
- Direct payload update in Qdrant

Usage:
    python scripts/update_top_artists.py --dry-run
    python scripts/update_top_artists.py
    python scripts/update_top_artists.py --username "specific_user"
"""

import asyncio
import aiohttp
import os
import sys
from pathlib import Path
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass

# Add parent to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
from tqdm import tqdm

load_dotenv()

LASTFM_API_KEY = os.getenv("LASTFM_API_KEY")
BASE_URL = "http://ws.audioscrobbler.com/2.0/"

# Rate limiting (Last.fm allows 5 req/s)
MAX_CONCURRENT = 4          # Parallel requests
DELAY_BETWEEN_BATCHES = 3   # Short pause between batches
BATCH_SIZE = 50


@dataclass
class UpdateStats:
    """Track update statistics"""
    total: int = 0
    updated: int = 0
    skipped_no_data: int = 0
    api_errors: int = 0
    not_found: int = 0

    def print_summary(self):
        print("\n" + "=" * 50)
        print("UPDATE SUMMARY")
        print("=" * 50)
        print(f"Total users processed: {self.total}")
        print(f"  Updated:      {self.updated}")
        print(f"  No data:      {self.skipped_no_data}")
        print(f"  API errors:   {self.api_errors}")
        print(f"  Not found:    {self.not_found}")
        if self.total > 0:
            success_rate = self.updated / self.total * 100
            print(f"\nSuccess rate: {success_rate:.1f}%")
        print("=" * 50)


class TopArtistsUpdater:
    """Update top_artists payload without regenerating embeddings"""

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.session = None
        self.qdrant_service = None
        self.stats = UpdateStats()

    async def __aenter__(self):
        connector = aiohttp.TCPConnector(limit=50, ttl_dns_cache=300)
        timeout = aiohttp.ClientTimeout(total=15, connect=5)
        self.session = aiohttp.ClientSession(connector=connector, timeout=timeout)

        from app.services.qdrant_service import qdrant_service
        self.qdrant_service = qdrant_service

        return self

    async def __aexit__(self, *args):
        if self.session:
            await self.session.close()

    async def fetch_top_artists(self, username: str, limit: int = 50) -> Tuple[Optional[List[str]], str]:
        """
        Fetch top artists from Last.fm for a user.
        Returns (artist_names, status) where status is 'success', 'not_found', 'no_data', or 'error'
        """
        params = {
            "method": "user.getTopArtists",
            "user": username,
            "api_key": self.api_key,
            "format": "json",
            "limit": limit,
            "period": "overall"
        }

        try:
            async with self.session.get(BASE_URL, params=params) as resp:
                if resp.status == 404:
                    return None, "not_found"

                if resp.status == 429:
                    # Rate limited - wait and retry once
                    await asyncio.sleep(2)
                    async with self.session.get(BASE_URL, params=params) as retry_resp:
                        if retry_resp.status != 200:
                            return None, "error"
                        data = await retry_resp.json()
                elif resp.status != 200:
                    return None, "error"
                else:
                    data = await resp.json()

                # Check for Last.fm error
                if "error" in data:
                    error_code = data.get("error")
                    if error_code == 6:  # User not found
                        return None, "not_found"
                    return None, "error"

                # Parse artists
                artists = data.get("topartists", {}).get("artist", [])
                if not artists or len(artists) < 5:
                    return None, "no_data"

                artist_names = [a.get("name") for a in artists if a.get("name")]
                return artist_names[:30], "success"  # Return top 30

        except asyncio.TimeoutError:
            return None, "error"
        except Exception:
            return None, "error"

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
                    "current_artists_count": len(point.payload.get("top_artists", [])),
                    "payload": point.payload
                })

            if next_offset is None:
                break
            offset = next_offset

        return all_users

    def update_user_payload(self, user_id: str, new_artists: List[str]):
        """Update only the top_artists field in Qdrant payload using set_payload (fast!)"""
        from datetime import datetime

        # Use set_payload - much faster than retrieve + upsert
        self.qdrant_service.client.set_payload(
            collection_name=self.qdrant_service.collection_name,
            payload={
                "top_artists": new_artists,
                "updated_at": datetime.utcnow().isoformat()
            },
            points=[user_id]
        )
        return True

    async def update_user(self, user: dict, dry_run: bool = False, semaphore: asyncio.Semaphore = None) -> bool:
        """Update a single user's top_artists"""
        username = user["username"]

        async with semaphore:
            # Fetch fresh top artists from Last.fm
            artists, status = await self.fetch_top_artists(username)

            if status == "not_found":
                self.stats.not_found += 1
                return False
            elif status == "no_data":
                self.stats.skipped_no_data += 1
                return False
            elif status == "error":
                self.stats.api_errors += 1
                return False

            # Success - update payload
            if not dry_run:
                try:
                    self.update_user_payload(user["user_id"], artists)
                except Exception as e:
                    print(f"  Error updating {username}: {e}")
                    self.stats.api_errors += 1
                    return False

            self.stats.updated += 1
            return True

    async def update_all(
        self,
        dry_run: bool = False,
        single_user: Optional[str] = None
    ):
        """Update top_artists for all users"""

        if single_user:
            print(f"\nTesting single user: {single_user}")
            user = self.qdrant_service.get_user_by_username(single_user)
            if not user:
                print(f"User '{single_user}' not found in database")
                return

            artists, status = await self.fetch_top_artists(single_user)
            print(f"Status: {status}")
            if artists:
                print(f"Found {len(artists)} artists:")
                for i, a in enumerate(artists[:10], 1):
                    print(f"  {i}. {a}")
                if len(artists) > 10:
                    print(f"  ... and {len(artists) - 10} more")

            if not dry_run and artists:
                self.update_user_payload(user["user_id"], artists)
                print(f"\nUpdated {single_user} with {len(artists)} artists")
            return

        # Get all users
        print("Fetching users from Qdrant...")
        all_users = self.get_all_users()

        # Filter users that already have 30 artists (optional optimization)
        users_to_update = [u for u in all_users if u["current_artists_count"] < 30]
        already_updated = len(all_users) - len(users_to_update)

        print(f"Total users: {len(all_users)}")
        print(f"Already have 30 artists: {already_updated}")
        print(f"Need update: {len(users_to_update)}")

        if dry_run:
            print("\nDRY RUN - No changes will be saved")

        print(f"Concurrency: {MAX_CONCURRENT} parallel requests")
        print()

        self.stats.total = len(users_to_update)
        semaphore = asyncio.Semaphore(MAX_CONCURRENT)

        pbar = tqdm(total=len(users_to_update), desc="Updating")
        completed = 0

        async def process_user(user):
            nonlocal completed
            result = await self.update_user(user, dry_run=dry_run, semaphore=semaphore)
            completed += 1
            pbar.update(1)
            pbar.set_postfix({
                'ok': self.stats.updated,
                'err': self.stats.api_errors,
                'skip': self.stats.skipped_no_data
            })
            return result

        for batch_num, i in enumerate(range(0, len(users_to_update), BATCH_SIZE)):
            batch = users_to_update[i:i + BATCH_SIZE]

            if batch_num > 0:
                pbar.set_description(f"Pausing {DELAY_BETWEEN_BATCHES}s")
                await asyncio.sleep(DELAY_BETWEEN_BATCHES)
                pbar.set_description("Updating")

            # Process batch in parallel (semaphore limits concurrency)
            tasks = [process_user(user) for user in batch]
            await asyncio.gather(*tasks)

        pbar.close()
        self.stats.print_summary()


async def main():
    import argparse

    parser = argparse.ArgumentParser(description="Update top_artists payload (no embedding regen)")
    parser.add_argument("--dry-run", action="store_true", help="Don't save changes")
    parser.add_argument("--username", type=str, help="Update single user (test mode)")
    args = parser.parse_args()

    if not LASTFM_API_KEY:
        print("LASTFM_API_KEY not found in environment")
        return 1

    print("=" * 50)
    print("TOP ARTISTS PAYLOAD UPDATER")
    print("(No embedding regeneration)")
    print("=" * 50)

    async with TopArtistsUpdater(LASTFM_API_KEY) as updater:
        total = updater.qdrant_service.count_users()
        print(f"Database has {total} users")
        print()

        await updater.update_all(
            dry_run=args.dry_run,
            single_user=args.username
        )

    return 0


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    exit(exit_code)
