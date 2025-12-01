"""
Merge Last.fm supplement data with FMA format for GNN training
Now includes genre assignment from tags
"""

import pandas as pd
import json
from pathlib import Path
from collections import Counter

# Noisy tags to filter out (artist names, metadata, locations, etc.)
NOISY_TAG_PATTERNS = [
    'seen live', 'favorites', 'favourite', 'favorite', 'love',
    'my music', 'check out', 'spotify', 'youtube', 'last.fm',
    'american', 'british', 'canadian', 'australian', 'swedish',
    'male vocalists', 'female vocalists', 'singer-songwriter',
    '00s', '10s', '20s', '60s', '70s', '80s', '90s', '2000s', '2010s', '2020s',
    'good', 'cool', 'awesome', 'best', 'great',
    'to listen', 'to buy', 'owned', 'wishlist'
]

# Direct tag to FMA genre_id mapping (based on FMA genres.csv)
TAG_TO_GENRE_ID = {
    # Electronic (15)
    'electronic': 15, 'electro': 15, 'electronica': 15, 'edm': 15,
    'house': 15, 'techno': 15, 'trance': 15, 'dubstep': 15,
    'drum and bass': 15, 'dnb': 15, 'ambient': 15, 'idm': 15,
    'synth': 15, 'synthwave': 15, 'synth-pop': 15, 'synthpop': 15,
    'downtempo': 15, 'chillwave': 15, 'trip-hop': 15, 'trip hop': 15,
    
    # Rock (12)
    'rock': 12, 'alternative': 12, 'alternative rock': 12, 'indie rock': 12,
    'garage rock': 12, 'psychedelic rock': 12, 'hard rock': 12,
    'progressive rock': 12, 'prog rock': 12, 'classic rock': 12,
    'indie': 12, 'shoegaze': 12, 'grunge': 12, 'britpop': 12,
    
    # Punk (25)
    'punk': 25, 'punk rock': 25, 'pop punk': 25, 'hardcore': 25,
    'post-punk': 25, 'emo': 25, 'screamo': 25,
    
    # Metal (31)
    'metal': 31, 'heavy metal': 31, 'death metal': 31, 'black metal': 31,
    'thrash metal': 31, 'metalcore': 31, 'progressive metal': 31,
    
    # Pop (10)
    'pop': 10, 'dance-pop': 10, 'electropop': 10, 'art pop': 10,
    'dream pop': 10, 'k-pop': 10, 'kpop': 10, 'j-pop': 10,
    'power pop': 10, 'teen pop': 10, 'bubblegum pop': 10,
    
    # Hip-Hop (21)
    'hip-hop': 21, 'hip hop': 21, 'hiphop': 21, 'rap': 21,
    'trap': 21, 'gangsta rap': 21, 'conscious hip hop': 21,
    'underground hip-hop': 21, 'east coast hip hop': 21,
    'west coast hip hop': 21, 'southern hip hop': 21,
    
    # R&B/Soul (14)
    'rnb': 14, 'r&b': 14, 'soul': 14, 'neo-soul': 14, 'neo soul': 14,
    'motown': 14, 'funk': 19, 'disco': 11, 'gospel': 14,
    
    # Folk (17)
    'folk': 17, 'indie folk': 17, 'folk rock': 17, 'acoustic': 17,
    'americana': 17, 'singer-songwriter': 17,
    
    # Country (9)
    'country': 9, 'country rock': 9, 'alt-country': 9,
    
    # Jazz (4)
    'jazz': 4, 'smooth jazz': 4, 'jazz fusion': 4, 'bebop': 4,
    'swing': 4, 'nu jazz': 4,
    
    # Blues (3)
    'blues': 3, 'blues rock': 3, 'rhythm and blues': 3,
    
    # Classical (5)
    'classical': 5, 'orchestra': 5, 'symphonic': 5, 'chamber music': 5,
    'opera': 5, 'baroque': 5, 'romantic': 5,
    
    # Latin/International (2)
    'latin': 2, 'latino': 2, 'reggaeton': 2, 'salsa': 2,
    'bossa nova': 2, 'world': 2, 'world music': 2,
    'reggae': 2, 'ska': 2, 'dub': 2,
    
    # Lo-Fi (27)
    'lo-fi': 27, 'lofi': 27, 'lo fi': 27, 'bedroom pop': 27,
    
    # Post-Rock (26)
    'post-rock': 26, 'post rock': 26, 'atmospheric': 26,
    
    # Experimental (1 - Avant-Garde)
    'experimental': 1, 'avant-garde': 1, 'noise': 32,
    
    # Soundtrack (18)
    'soundtrack': 18, 'score': 18, 'film score': 18, 'ost': 18,
}


def is_noisy_tag(tag: str) -> bool:
    """Check if a tag is noisy (should be filtered)"""
    tag_lower = tag.lower()
    for pattern in NOISY_TAG_PATTERNS:
        if pattern in tag_lower:
            return True
    return False


def tags_to_genre_ids(tags: list) -> list:
    """Convert Last.fm tags to FMA genre IDs"""
    if not tags:
        return []
    
    genre_ids = set()
    for tag in tags:
        if is_noisy_tag(tag):
            continue
        
        tag_lower = tag.lower().strip()
        if tag_lower in TAG_TO_GENRE_ID:
            genre_ids.add(TAG_TO_GENRE_ID[tag_lower])
    
    return list(genre_ids)


def merge_lastfm_to_augmented():
    """Merge Last.fm supplement data into augmented format with genre assignment"""
    
    supplement_dir = Path("data/lastfm_supplement")
    augmented_dir = Path("data/augmented")
    augmented_dir.mkdir(parents=True, exist_ok=True)
    
    # Load Last.fm tracks
    tracks_path = supplement_dir / "tracks.csv"
    if not tracks_path.exists():
        print("❌ No Last.fm tracks found")
        return
    
    df = pd.read_csv(tracks_path)
    print(f"📥 Loaded {len(df)} Last.fm tracks")
    
    # Load artist info for tags
    artist_info_path = supplement_dir / "artist_info.json"
    artist_tags = {}
    if artist_info_path.exists():
        with open(artist_info_path, "r", encoding='utf-8') as f:
            artist_info = json.load(f)
            for artist, info in artist_info.items():
                artist_tags[artist.lower()] = info.get('tags', [])
    
    # Process tracks with genre assignment
    formatted_tracks = []
    genre_stats = Counter()
    tracks_with_genres = 0
    
    for idx, row in df.iterrows():
        artist = row['artist_name']
        tags = artist_tags.get(artist.lower(), [])
        
        # Convert tags to genre IDs
        genre_ids = tags_to_genre_ids(tags)
        
        if genre_ids:
            tracks_with_genres += 1
            for gid in genre_ids:
                genre_stats[gid] += 1
        
        formatted_tracks.append({
            'track_id': f"lastfm_{idx}",
            'track_name': row['track_name'],
            'artist_name': artist,
            'tags': str(tags),
            'genre_ids': str(genre_ids) if genre_ids else '[]'
        })
    
    # Save formatted tracks
    output_df = pd.DataFrame(formatted_tracks)
    output_path = augmented_dir / "lastfm_tracks_formatted.csv"
    output_df.to_csv(output_path, index=False)
    
    print(f"\n✅ Saved {len(formatted_tracks)} tracks to {output_path}")
    print(f"📊 Tracks with genre assignments: {tracks_with_genres}/{len(formatted_tracks)} ({100*tracks_with_genres/len(formatted_tracks):.1f}%)")
    
    # Show genre distribution
    print(f"\n🎵 Top genres assigned:")
    for genre_id, count in genre_stats.most_common(10):
        print(f"   Genre {genre_id}: {count} tracks")
    
    # Build artist similarity edges
    build_artist_edges(artist_info, augmented_dir)


def normalize_artist_name(name: str) -> str:
    """Normalize artist name for matching"""
    import re
    # Lowercase
    name = name.lower().strip()
    # Remove "the " prefix
    if name.startswith('the '):
        name = name[4:]
    # Remove special characters
    name = re.sub(r'[^\w\s]', '', name)
    # Collapse whitespace
    name = re.sub(r'\s+', ' ', name)
    return name


def build_artist_edges(artist_info: dict, output_dir: Path):
    """Build artist similarity graph with normalized matching"""
    
    edges = []
    all_artists = set()
    
    # Create normalized lookup
    normalized_to_original = {}
    for artist in artist_info.keys():
        norm = normalize_artist_name(artist)
        normalized_to_original[norm] = artist
        all_artists.add(artist)
    
    # Build edges from similar artists
    for artist, info in artist_info.items():
        similar = info.get('similar_artists', [])
        for sim_artist in similar:
            # Try exact match first
            if sim_artist in all_artists:
                edges.append({'source': artist, 'target': sim_artist})
            else:
                # Try normalized match
                sim_norm = normalize_artist_name(sim_artist)
                if sim_norm in normalized_to_original:
                    original = normalized_to_original[sim_norm]
                    edges.append({'source': artist, 'target': original})
    
    # Remove duplicates
    unique_edges = []
    seen = set()
    for edge in edges:
        key = tuple(sorted([edge['source'], edge['target']]))
        if key not in seen:
            seen.add(key)
            unique_edges.append(edge)
    
    # Save
    output = {
        'artists': list(all_artists),
        'edges': unique_edges
    }
    
    output_path = output_dir / "artist_graph_edges.json"
    with open(output_path, "w", encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    
    print(f"\n🔗 Saved {len(unique_edges)} artist edges to {output_path}")


if __name__ == "__main__":
    print("=" * 60)
    print("🎵 Merging Last.fm data with genre assignment")
    print("=" * 60)
    merge_lastfm_to_augmented()
    print("\n✅ Done! Run train_gnn.ipynb to retrain the model.")