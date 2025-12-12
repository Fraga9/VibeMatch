"""
Fetch missing artists from Last.fm and prepare data for GNN retraining

Optimized version with:
- Concurrent requests with semaphore
- Connection pooling
- Batch processing
- Retry logic with exponential backoff
"""

import asyncio
import httpx
import json
import pandas as pd
from pathlib import Path
from typing import List, Dict, Tuple
import os
from dotenv import load_dotenv
from dataclasses import dataclass, field
import time

load_dotenv()

LASTFM_API_KEY = os.getenv("LASTFM_API_KEY")
BASE_URL = "http://ws.audioscrobbler.com/2.0/"

# Tuning parameters
MAX_CONCURRENT_REQUESTS = 10  # Last.fm allows ~5 req/sec, we use 10 with delays
REQUEST_TIMEOUT = 15.0
MAX_RETRIES = 3
RETRY_DELAY = 1.0


@dataclass
class FetchResult:
    """Container for artist fetch results"""
    tracks: List[Dict] = field(default_factory=list)
    tags: List[str] = field(default_factory=list)
    similar: List[str] = field(default_factory=list)
    success: bool = False


class LastFmDataFetcher:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.semaphore = asyncio.Semaphore(MAX_CONCURRENT_REQUESTS)
        self._client: httpx.AsyncClient | None = None

    async def __aenter__(self):
        self._client = httpx.AsyncClient(
            timeout=REQUEST_TIMEOUT,
            limits=httpx.Limits(max_connections=MAX_CONCURRENT_REQUESTS * 2),
            http2=True  # Enable HTTP/2 for better performance
        )
        return self

    async def __aexit__(self, *args):
        if self._client:
            await self._client.aclose()

    async def _request_with_retry(self, params: Dict) -> Dict | None:
        """Make request with retry logic and rate limiting"""
        async with self.semaphore:
            for attempt in range(MAX_RETRIES):
                try:
                    response = await self._client.get(BASE_URL, params=params)
                    
                    if response.status_code == 429:  # Rate limited
                        wait_time = RETRY_DELAY * (2 ** attempt)
                        await asyncio.sleep(wait_time)
                        continue
                    
                    if response.status_code != 200 or not response.text:
                        return None
                    
                    data = response.json()
                    if 'error' in data:
                        return None
                    
                    return data
                    
                except (httpx.TimeoutException, httpx.HTTPError):
                    if attempt < MAX_RETRIES - 1:
                        await asyncio.sleep(RETRY_DELAY * (2 ** attempt))
                    continue
            
            return None

    async def get_artist_top_tracks(self, artist: str, limit: int = 50) -> List[Dict]:
        """Fetch top tracks for an artist"""
        params = {
            'method': 'artist.getTopTracks',
            'artist': artist,
            'api_key': self.api_key,
            'limit': limit,
            'format': 'json'
        }
        
        data = await self._request_with_retry(params)
        if not data:
            return []
        
        tracks = data.get('toptracks', {}).get('track', [])
        return [
            {
                'track_name': track.get('name'),
                'artist_name': artist,
                'playcount': int(track.get('playcount', 0)),
                'listeners': int(track.get('listeners', 0))
            }
            for track in tracks
        ]

    async def get_artist_tags(self, artist: str) -> List[str]:
        """Fetch genre tags for an artist"""
        params = {
            'method': 'artist.getTopTags',
            'artist': artist,
            'api_key': self.api_key,
            'limit': 10,
            'format': 'json'
        }
        
        data = await self._request_with_retry(params)
        if not data:
            return []
        
        tags = data.get('toptags', {}).get('tag', [])
        return [tag.get('name', '').lower() for tag in tags if tag.get('name')]

    async def get_similar_artists(self, artist: str, limit: int = 10) -> List[str]:
        """Fetch similar artists"""
        params = {
            'method': 'artist.getSimilar',
            'artist': artist,
            'api_key': self.api_key,
            'limit': limit,
            'format': 'json'
        }
        
        data = await self._request_with_retry(params)
        if not data:
            return []
        
        similar = data.get('similarartists', {}).get('artist', [])
        return [a.get('name') for a in similar if a.get('name')]

    async def fetch_artist_complete(self, artist: str) -> Tuple[str, FetchResult]:
        """Fetch all data for a single artist concurrently"""
        # Run all 3 requests in parallel
        tracks_task = self.get_artist_top_tracks(artist)
        tags_task = self.get_artist_tags(artist)
        similar_task = self.get_similar_artists(artist)
        
        tracks, tags, similar = await asyncio.gather(
            tracks_task, tags_task, similar_task
        )
        
        result = FetchResult(
            tracks=tracks,
            tags=tags,
            similar=similar,
            success=bool(tracks or tags)
        )
        
        return artist, result


async def fetch_missing_artists_data(
    missing_artists: List[str], 
    api_key: str,
    progress_callback=None
) -> Tuple[List[Dict], Dict]:
    """Fetch data for all missing artists with concurrent processing"""
    
    all_tracks = []
    artist_info = {}
    
    print(f"\n📥 Fetching data for {len(missing_artists)} artists...")
    print(f"   Using {MAX_CONCURRENT_REQUESTS} concurrent connections\n")
    
    start_time = time.time()
    
    async with LastFmDataFetcher(api_key) as fetcher:
        # Process all artists concurrently
        tasks = [fetcher.fetch_artist_complete(artist) for artist in missing_artists]
        
        # Use as_completed for real-time progress
        completed = 0
        for coro in asyncio.as_completed(tasks):
            artist, result = await coro
            completed += 1
            
            if result.success:
                all_tracks.extend(result.tracks)
                artist_info[artist] = {
                    'tags': result.tags,
                    'similar_artists': result.similar,
                    'track_count': len(result.tracks)
                }
                status = f"✅ {len(result.tracks)} tracks, {len(result.tags)} tags"
            else:
                status = "❌ Failed"
            
            # Progress bar
            pct = (completed / len(missing_artists)) * 100
            print(f"[{completed}/{len(missing_artists)}] {pct:5.1f}% | {artist[:30]:<30} | {status}")
    
    elapsed = time.time() - start_time
    rate = len(missing_artists) / elapsed if elapsed > 0 else 0
    
    print(f"\n⏱️  Completed in {elapsed:.1f}s ({rate:.1f} artists/sec)")
    
    return all_tracks, artist_info


def save_supplement_data(
    tracks: List[Dict], 
    artist_info: Dict, 
    output_dir: str = "data/lastfm_supplement"
):
    """Save fetched data for later use"""
    Path(output_dir).mkdir(parents=True, exist_ok=True)

    # Save tracks as CSV
    if tracks:
        df_tracks = pd.DataFrame(tracks)
        df_tracks.to_csv(f"{output_dir}/tracks.csv", index=False)
        print(f"\n💾 Saved {len(tracks)} tracks")

    # Save artist info as JSON
    with open(f"{output_dir}/artist_info.json", "w", encoding='utf-8') as f:
        json.dump(artist_info, f, indent=2, ensure_ascii=False)
    print(f"💾 Saved {len(artist_info)} artists info")

    # Create summary
    summary = {
        'total_tracks': len(tracks),
        'total_artists': len(artist_info),
        'artists': list(artist_info.keys())
    }
    with open(f"{output_dir}/summary.json", "w", encoding='utf-8') as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)


def load_existing_data(output_dir: str = "data/lastfm_supplement") -> Tuple[List[Dict], Dict]:
    """Load existing data if available"""
    existing_tracks = []
    existing_info = {}
    
    info_path = Path(output_dir) / "artist_info.json"
    tracks_path = Path(output_dir) / "tracks.csv"
    
    if info_path.exists():
        with open(info_path, "r", encoding='utf-8') as f:
            existing_info = json.load(f)
        print(f"📂 Loaded {len(existing_info)} existing artists")
    
    if tracks_path.exists():
        existing_tracks = pd.read_csv(tracks_path).to_dict('records')
        print(f"📂 Loaded {len(existing_tracks)} existing tracks")
    
    return existing_tracks, existing_info


def load_missing_artists_from_tracker(
    tracker_path: str = "data/missing_artists.json",
    match_type: str = "all",
    min_occurrences: int = 5
) -> List[str]:
    """Load missing artists from the tracking file generated by fetch_lastfm_users.py

    Args:
        tracker_path: Path to the tracking file
        match_type: Filter by match type ("all", "fuzzy", "missing", "zero_shot")
        min_occurrences: Minimum occurrences required

    Returns:
        List of artist names meeting the criteria
    """
    tracker_file = Path(tracker_path)

    if not tracker_file.exists():
        print(f"⚠️  No tracking file found at {tracker_path}")
        return []

    with open(tracker_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    # New format (detailed dict with occurrences)
    if "artists" in data and isinstance(data["artists"], dict):
        # Sort by occurrence, descending
        sorted_artists = sorted(
            data["artists"].items(),
            key=lambda x: x[1].get("occurrences", 0),
            reverse=True
        )

        print(f"\n📋 Loaded {len(sorted_artists)} missing artists from tracker:")
        print(f"\n🔝 Top 10 by occurrence:")
        for i, (artist, info) in enumerate(sorted_artists[:10], 1):
            print(f"  {i:2d}. {artist[:35]:<35} | "
                  f"Occurrences: {info['occurrences']:3d} | "
                  f"Type: {info['match_type']}")

        # Group by match type
        by_type = {}
        for artist, info in sorted_artists:
            match_type_val = info.get('match_type', 'unknown')
            by_type.setdefault(match_type_val, []).append(artist)

        print(f"\n📊 Breakdown by match type:")
        for mt, artists in by_type.items():
            print(f"   • {mt}: {len(artists)} artists")
        print()

        # Filter by criteria
        filtered_artists = []
        for artist, info in sorted_artists:
            # Filter by occurrence threshold
            if info.get("occurrences", 0) < min_occurrences:
                continue
            # Filter by match type
            if match_type != "all" and info.get("match_type") != match_type:
                continue
            filtered_artists.append(artist)

        if len(filtered_artists) < len(sorted_artists):
            print(f"🔍 Filtered to {len(filtered_artists)} artists (min_occurrences={min_occurrences}, match_type={match_type})\n")

        return filtered_artists

    # Old format (simple list)
    elif "artists" in data and isinstance(data["artists"], list):
        missing = data["artists"]
        reasons = data.get("reasons", {})

        if missing:
            print(f"\n📋 Loaded {len(missing)} missing artists from tracker (old format):")
            # Group by reason
            by_reason = {}
            for artist in missing:
                reason = reasons.get(artist, "unknown")
                by_reason.setdefault(reason, []).append(artist)

            for reason, artists in by_reason.items():
                print(f"   • {reason}: {len(artists)} artists")
            print()

        return missing

    return []


async def main():
    import argparse

    # Parse command-line arguments
    parser = argparse.ArgumentParser(description="Fetch missing artists from Last.fm")
    parser.add_argument(
        "--match-type",
        choices=["all", "fuzzy", "missing", "zero_shot"],
        default="all",
        help="Only fetch artists of specific match type (default: all)"
    )
    parser.add_argument(
        "--min-occurrences",
        type=int,
        default=5,
        help="Minimum occurrences required (default: 5)"
    )
    args = parser.parse_args()

    print("=" * 60)
    print("🎵 Last.fm Missing Artists Data Fetcher (Optimized)")
    print("=" * 60)
    print(f"Filters: match_type={args.match_type}, min_occurrences={args.min_occurrences}")
    print("=" * 60)

    # Load existing data
    existing_tracks, existing_info = load_existing_data()
    existing_artists = set(existing_info.keys())

    # Try to load missing artists from tracker first
    tracked_missing = load_missing_artists_from_tracker(
        match_type=args.match_type,
        min_occurrences=args.min_occurrences
    )
    
    # If no tracked artists, use hardcoded list as fallback
    if not tracked_missing:
        print("📝 Using hardcoded artist list as fallback\n")
        missing_artists = [
            "Kanye West", "The Beach Boys", "The Killers", "The Cure",
            "My Chemical Romance", "Title Fight", "Joji", "Babasónicos",
            "Little Jesus", "Daniel Caesar", "Mac DeMarco", "Faye Webster",
            "Hotel Ugly", "Still Woozy", "The Marías", "José José",
            "Post Malone", "A Flock of Seagulls", "Rojuu", "Def Leppard",
            "Soda Stereo", "The Weeknd", "Radiohead", "Bandalos Chinos",
            "Lana Del Rey", "Cuco", "Pusha T", "Lorde", "Charli xcx",
            "NewJeans", "Weezer", "Enjambre", "Pescado Rabioso", "Zoé",
            "Green Day", "John Mayer", "Billy Joel", "Mac Miller",
            "AKRIILA", "Kings of Convenience", "No Doubt", "Twenty One Pilots",
            "Chappell Roan", "Melody's Echo Chamber", "Tito Double P",
            "Loona", "Depeche Mode", "The Doors", "Mazzy Star",
            "Lou Reed", "Bob Dylan", "Fugazi", "Stevie Wonder", "Mon Laferte", 
            "Papa Topo", "*NSYNC", "Earth, Wind & Fire", "Ichiko Aoba",
            "Talking Heads", "Saint Motel", "Nujabes", "Maroon 5", "wave to earth",
            "Gwinn", "BROCKHAMPTON", "Rage Against the Machine", "Bobby Pulido", 
            "Los Fabulosos Cadillacs", "Bladee", "Pavement",
            "Panchiko", "Matt Maltese", "Playboi Carti", "Sunlid", "The Smiths",
            "Queen", "she's green", "Rod Stewart", "Red Hot Chili Peppers", "Fishmans",
            "The Parcels", "ABBA", "Maria Daniela Y Su Sonido Lasser", 
            "Surfistas del Sistema", "Cariño", "Jorge Drexler", "Daft Punk",
            "Cupido", "Lewis OfMan", "Saja Boys", "Cro-Magnon", "Gorillaz",
            "Laufey", "LJONES", "Yeat", "Foster the People", "Bruno Mars", "Chezile",
            "Tan Bionica", "Cameron Winter", "MF DOOM", "The Notorious B.I.G.",
            "HOME MADE 家族", "Baby Keem", "Rex Orange County", "BABYMETAL",
            "DANGERDOOM", "Chavo", "Lil Yachty", "Joost", "Lin-Manuel Miranda",
            "tarowo", "Leslie Odom Jr.", "Kali Uchis", "缺省", "U2", "Fleetwood Mac", "Duran Duran", "Alvvays", "ataquemos",
            "Niños del Cerro", "Jalen Ngonda", "montegrande", "Patio Solar", "Toto",
            "LSD and the Search for God", "Junior H", "Él mató a un policía motorizado",
            "Michael Jackson", "Metronomy", "Paco Amoroso", "The Beatles", "Pink Floyd",
            "Ca7riel & Paco Amoroso", "Deftones", "HUNTR/X", "Polo & Pan",
            "Belle and Sebastian", "Joaquim Roberto Braga", "高中正義", "Slipknot",
            "Chano", "wifiskeleton", "Las Ligas Menores", "Foo Fighters", "Madvillain",
            "Jordan Ward", "Whirr", "Não Ao Futebol Moderno", "Natanael Cano", "Justice",
            "RSP", "Sabino", "MINMI", "Korn", "Axolotes Mexicanos", "Kiddie Gang",
            "Metric", "Björk", "Circus' End", "Sing-Sing", "cacomixtle", "f(x)",
            "Duster", "Mannequin Pussy", "Princess Chelsea", "Angel Castillo Cas",
            "Linda Perhacs", "A.R. Kane", "Dean Blunt", "Dave Bixby",
            "Cleaners From Venus", "PASTEL GHOST", "Playa Gótica", "Astrid Sonne",
            "Belanova", "America", "Oasis", "Hall & Oates", "asia menor", "Loathe", 
            "David Bowie", "Javiera Mena", "Palacio Infantil", "Amantes Del Futuro",
            "Silvana Estrada", "Mint Field", "Jimmy Eat World", "Pom Pom Squad", 
            "mia.u", "Christopher Bear", "Foxtails", "The Microphones",
            "Air Miami", "elaiyah", "diciembre de 2001", "centenario", "Nina Suárez",
            "Aphex Twin", "Héctor Lavoe", "Deerhunter", "Estrella",
            "Adobes Buenos", "Jasiel Núñez", "ALAMBRE DE PÚAS", "2003 Toyota Corolla",
            "Alex G", "Secret Potion", "Crystal Castles", "Car Seat Headrest", 
            "Enrique Bunbury", "Santa Sabina", "Swirlies", "tricot", "ミドリ", "La Lá", "Cap'n Jazz",
            "Yves", "Bleary Eyed", "Lord Snow", "Autolux",
            "Sleeping With Sirens", "Pearl Jam", "Death Grips", "Beach House",
            "The Flaming Lips", "Slint", "Los Hermanos", "Nine Inch Nails",
            "Sunny Day Real Estate", "Alexisonfire",
            "Novo Amor", "Lost Frequencies", "Linkin Park", "Evanescence",
            "Busted", "Whitney Houston", "George Michael", "Everything But the Girl",
            "Boston",
            "desert sand feels warm at night", "Arnold Schoenberg", "George Clanton",
            "Park Young-goo", "Sonic Youth", "Hong Kong Express", "澄空時間",
            "Bob Hocko", "Fornax Void",
            "Los Estómagos", "C418", "3Pecados", "Frank Zappa", "Riki Musso",
            "Travesía", "The Zombies", "Gentle Giant", "Claude Debussy",
            "t e l e p a t h テレパシー能力者", "Lady Gaga", "Social Distortion",
            "Calvin Harris", "Will Graefe", "Dua Lipa", "Porcupine Tree", "Suéter",
            "Seatbelts", "Brave Little Abacus", "Kultivator", "Jonathan Geer",
            "Roedelius", "川村ゆみ"
        ]
    else:
        missing_artists = tracked_missing

    # Filter to only new artists
    new_artists = [a for a in missing_artists if a not in existing_artists]
    
    if not new_artists:
        print("\n✅ All artists already fetched!")
        return

    print(f"\n📥 {len(new_artists)} new artists to fetch")
    print(f"⏭️  Skipping {len(missing_artists) - len(new_artists)} existing\n")
    
    # Fetch new data
    tracks, artist_info = await fetch_missing_artists_data(new_artists, LASTFM_API_KEY)
    
    # Merge with existing
    existing_tracks.extend(tracks)
    existing_info.update(artist_info)

    # Optionally fetch similar artists
    similar_to_fetch = set()
    for info in artist_info.values():
        for similar in info.get('similar_artists', [])[:50]: 
            if similar not in existing_artists and similar not in artist_info:
                similar_to_fetch.add(similar)
    
    if similar_to_fetch:
        # Limit to first 1500 if too many
        similar_list = list(similar_to_fetch)[:1500]
        print(f"\n📥 Fetching {len(similar_list)} similar artists (from {len(similar_to_fetch)} total)...")
        similar_tracks, similar_info = await fetch_missing_artists_data(
            similar_list, LASTFM_API_KEY
        )
        existing_tracks.extend(similar_tracks)
        existing_info.update(similar_info)

    # Save all data
    save_supplement_data(existing_tracks, existing_info)

    print("\n" + "=" * 60)
    print("✅ Done!")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())