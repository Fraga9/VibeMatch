"""
Fetch missing artists from Last.fm and prepare data for GNN retraining

This script:
1. Reads missing artists from logs/coverage
2. Fetches their top tracks from Last.fm
3. Creates a dataset supplement file
4. Can be merged into FMA data for retraining
"""

import asyncio
import httpx
import json
import pandas as pd
from pathlib import Path
from typing import List, Dict
import pickle
import os
from dotenv import load_dotenv

load_dotenv()

# Your Last.fm API key from env
LASTFM_API_KEY = os.getenv("LASTFM_API_KEY")
BASE_URL = "http://ws.audioscrobbler.com/2.0/"


class LastFmDataFetcher:
    def __init__(self, api_key: str):
        self.api_key = api_key

    async def get_artist_top_tracks(self, artist: str, limit: int = 50) -> List[Dict]:
        """Fetch top tracks for an artist"""
        params = {
            'method': 'artist.getTopTracks',
            'artist': artist,
            'api_key': self.api_key,
            'limit': limit,
            'format': 'json'
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(BASE_URL, params=params)
                
                if response.status_code != 200:
                    print(f"  ❌ HTTP error {response.status_code} for {artist}")
                    return []
                
                if not response.text:
                    print(f"  ❌ Empty response for {artist}")
                    return []
                
                data = response.json()

                if 'error' in data:
                    print(f"  ❌ Error fetching {artist}: {data.get('message')}")
                    return []

                tracks = data.get('toptracks', {}).get('track', [])

                result = []
                for track in tracks:
                    result.append({
                        'track_name': track.get('name'),
                        'artist_name': artist,
                        'playcount': int(track.get('playcount', 0)),
                        'listeners': int(track.get('listeners', 0))
                    })

                return result
        except Exception as e:
            print(f"  ❌ Exception fetching tracks for {artist}: {e}")
            return []

    async def get_artist_tags(self, artist: str) -> List[str]:
        """Fetch genre tags for an artist"""
        params = {
            'method': 'artist.getTopTags',
            'artist': artist,
            'api_key': self.api_key,
            'limit': 10,
            'format': 'json'
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(BASE_URL, params=params)
                
                if response.status_code != 200 or not response.text:
                    return []
                
                data = response.json()

                if 'error' in data:
                    return []

                tags = data.get('toptags', {}).get('tag', [])
                return [tag.get('name', '').lower() for tag in tags if tag.get('name')]
        except Exception as e:
            print(f"  ❌ Exception fetching tags for {artist}: {e}")
            return []

    async def get_similar_artists(self, artist: str, limit: int = 10) -> List[str]:
        """Fetch similar artists"""
        params = {
            'method': 'artist.getSimilar',
            'artist': artist,
            'api_key': self.api_key,
            'limit': limit,
            'format': 'json'
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(BASE_URL, params=params)
                
                if response.status_code != 200 or not response.text:
                    return []
                
                data = response.json()

                if 'error' in data:
                    return []

                similar = data.get('similarartists', {}).get('artist', [])
                return [a.get('name') for a in similar if a.get('name')]
        except Exception as e:
            print(f"  ❌ Exception fetching similar artists for {artist}: {e}")
            return []


async def fetch_missing_artists_data(missing_artists: List[str], api_key: str):
    """Fetch data for all missing artists"""
    fetcher = LastFmDataFetcher(api_key)

    all_tracks = []
    artist_info = {}

    print(f"\n📥 Fetching data for {len(missing_artists)} missing artists...")

    for artist in missing_artists:
        print(f"\n🎵 Processing: {artist}")

        # Fetch top tracks
        tracks = await fetcher.get_artist_top_tracks(artist, limit=50)
        print(f"  ✅ Found {len(tracks)} tracks")

        # Fetch tags
        tags = await fetcher.get_artist_tags(artist)
        print(f"  ✅ Found {len(tags)} tags: {', '.join(tags[:5])}")

        # Fetch similar artists
        similar = await fetcher.get_similar_artists(artist, limit=10)
        print(f"  ✅ Found {len(similar)} similar artists")

        # Store tracks
        all_tracks.extend(tracks)

        # Store artist info
        artist_info[artist] = {
            'tags': tags,
            'similar_artists': similar,
            'track_count': len(tracks)
        }

        # Rate limiting - increased to avoid throttling
        await asyncio.sleep(0.5)

    return all_tracks, artist_info


def save_supplement_data(tracks: List[Dict], artist_info: Dict, output_dir: str = "data/lastfm_supplement"):
    """Save fetched data for later use"""
    Path(output_dir).mkdir(parents=True, exist_ok=True)

    # Save tracks as CSV
    df_tracks = pd.DataFrame(tracks)
    df_tracks.to_csv(f"{output_dir}/tracks.csv", index=False)
    print(f"\n💾 Saved {len(tracks)} tracks to {output_dir}/tracks.csv")

    # Save artist info as JSON
    with open(f"{output_dir}/artist_info.json", "w", encoding='utf-8') as f:
        json.dump(artist_info, f, indent=2, ensure_ascii=False)
    print(f"💾 Saved artist info to {output_dir}/artist_info.json")

    # Create summary
    summary = {
        'total_tracks': len(tracks),
        'total_artists': len(artist_info),
        'artists': list(artist_info.keys())
    }

    with open(f"{output_dir}/summary.json", "w", encoding='utf-8') as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)
    print(f"💾 Saved summary to {output_dir}/summary.json")


async def main():
    # Top missing artists from your logs
    missing_artists = [
        "Kanye West",
        "The Beach Boys",
        "The Killers",
        "The Cure",
        "My Chemical Romance",
        "Title Fight",
        "Joji",
        "Babasónicos",
        "Little Jesus",
        "Daniel Caesar",
        "Mac DeMarco",
        "Faye Webster",
        "Hotel Ugly",
        "Still Woozy",
        "The Marías",
        "José José",
        "Post Malone",
        "A Flock of Seagulls",
        "Rojuu",
        "Def Leppard",
        "Soda Stereo",
        "The Weeknd",
        "Radiohead",
        "Bandalos Chinos",
        "Lana Del Rey",
        "Cuco",
        "Pusha T",
        "Lorde",
        "Charli xcx",
        "NewJeans",
        "Weezer",
        "Enjambre",
        "Pescado Rabioso",
        "Zoé",
        "Green Day",
        "John Mayer",
        "Billy Joel",
        "Mac Miller",
        "AKRIILA"
    ]

    print("=" * 60)
    print("🎵 Last.fm Missing Artists Data Fetcher")
    print("=" * 60)

    # Check for existing data
    existing_artists = set()
    existing_tracks = []
    existing_info = {}
    
    info_path = Path("data/lastfm_supplement/artist_info.json")
    tracks_path = Path("data/lastfm_supplement/tracks.csv")
    
    if info_path.exists():
        with open(info_path, "r", encoding='utf-8') as f:
            existing_info = json.load(f)
            existing_artists = set(existing_info.keys())
        print(f"📂 Found {len(existing_artists)} existing artists")
    
    if tracks_path.exists():
        existing_tracks = pd.read_csv(tracks_path).to_dict('records')
        print(f"📂 Found {len(existing_tracks)} existing tracks")

    # Filter to only new artists
    new_artists = [a for a in missing_artists if a not in existing_artists]
    
    if not new_artists:
        print("\n✅ All artists already fetched!")
    else:
        print(f"\n📥 Fetching {len(new_artists)} new artists (skipping {len(missing_artists) - len(new_artists)} existing)...")
        
        # Fetch only new data
        tracks, artist_info = await fetch_missing_artists_data(new_artists, LASTFM_API_KEY)
        
        # Merge with existing
        existing_tracks.extend(tracks)
        existing_info.update(artist_info)
        
        tracks = existing_tracks
        artist_info = existing_info

    # Also fetch similar artists (to create valid edges)
    similar_artists_to_fetch = set()
    for artist, info in artist_info.items():
        for similar in info.get('similar_artists', [])[:5]:  # Top 5 similar
            if similar not in missing_artists and similar not in artist_info:
                similar_artists_to_fetch.add(similar)
    
    if similar_artists_to_fetch:
        print(f"\n📥 Fetching {len(similar_artists_to_fetch)} similar artists...")
        similar_tracks, similar_info = await fetch_missing_artists_data(
            list(similar_artists_to_fetch), LASTFM_API_KEY
        )
        
        # Merge data
        tracks.extend(similar_tracks)
        artist_info.update(similar_info)

    # Save data
    save_supplement_data(tracks, artist_info)

    print("\n" + "=" * 60)
    print("✅ Done! Data saved to data/lastfm_supplement/")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Review the fetched data in data/lastfm_supplement/")
    print("2. Run merge_datasets.py to combine FMA + Last.fm data")
    print("3. Retrain the GNN model with train_gnn.ipynb")


if __name__ == "__main__":
    asyncio.run(main())