import httpx
import hashlib
import asyncio
from typing import List, Dict, Optional, Tuple
from functools import lru_cache
from contextlib import asynccontextmanager
from app.core.config import settings
from app.models.schemas import Artist, Track, RecentTrack, UserProfile


class LastFMAsyncService:
    """
    Optimized async service for Last.fm API
    
    Key optimizations:
    1. Persistent HTTP client with connection pooling
    2. Concurrent requests with semaphore-based rate limiting
    3. In-memory caching for artist tags and track info
    4. HTTP/2 support for multiplexing
    5. Batch operations where possible
    """

    # Class-level cache for artist tags (they rarely change)
    _artist_tags_cache: Dict[str, List[str]] = {}
    _track_info_cache: Dict[str, Dict] = {}
    
    def __init__(self):
        self.api_key = settings.LASTFM_API_KEY
        self.api_secret = settings.LASTFM_API_SECRET
        self.base_url = "http://ws.audioscrobbler.com/2.0/"
        
        # Shared client - created lazily
        self._client: Optional[httpx.AsyncClient] = None
        
        # Rate limiting: Last.fm allows ~5 requests/second
        # Using semaphore for concurrent request control
        self._semaphore = asyncio.Semaphore(5)
        
        # Placeholder image hashes to exclude
        self._placeholder_hashes = {
            '2a96cbd8b46e442fc41c2b86b821562f.png',
            'c6f59c1e5e7240a4c0d427abd71f3dbb.png',
        }

    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create the shared HTTP client with connection pooling"""
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                timeout=httpx.Timeout(30.0, connect=10.0),
                limits=httpx.Limits(
                    max_keepalive_connections=10,
                    max_connections=20,
                    keepalive_expiry=30.0
                ),
                http2=True,  # Enable HTTP/2 for multiplexing
            )
        return self._client

    async def close(self):
        """Close the HTTP client - call when done with the service"""
        if self._client and not self._client.is_closed:
            await self._client.aclose()
            self._client = None

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.close()

    async def _request(self, params: Dict) -> Dict:
        """
        Make a rate-limited request to Last.fm API
        Uses semaphore to control concurrent requests
        """
        async with self._semaphore:
            client = await self._get_client()
            response = await client.get(self.base_url, params=params)
            return response.json()

    async def _request_batch(self, params_list: List[Dict]) -> List[Dict]:
        """
        Execute multiple requests concurrently with rate limiting
        Much faster than sequential requests with sleep
        """
        tasks = [self._request(params) for params in params_list]
        return await asyncio.gather(*tasks, return_exceptions=True)

    def _generate_signature(self, params: Dict) -> str:
        """Generate API signature for authenticated requests"""
        sorted_params = sorted(params.items())
        sig_string = ''.join([f"{k}{v}" for k, v in sorted_params if k != 'format'])
        sig_string += self.api_secret
        return hashlib.md5(sig_string.encode('utf-8')).hexdigest()

    def _extract_image_url(self, images: List[Dict]) -> Optional[str]:
        """Extract highest quality non-placeholder image URL"""
        if not images:
            return None

        for size in ['mega', 'extralarge', 'large', 'medium']:
            for img in images:
                if img.get('size') == size:
                    url = img.get('#text', '').strip()
                    if url and not any(url.endswith(ph) for ph in self._placeholder_hashes):
                        return url

        for img in images:
            url = img.get('#text', '').strip()
            if url and not any(url.endswith(ph) for ph in self._placeholder_hashes):
                return url

        return None

    async def get_session_key(self, token: str) -> Tuple[str, str]:
        """Exchange Last.fm auth token for session key"""
        params = {
            'method': 'auth.getSession',
            'api_key': self.api_key,
            'token': token,
        }
        params['api_sig'] = self._generate_signature(params)
        params['format'] = 'json'

        data = await self._request(params)
        if 'error' in data:
            raise Exception(f"Last.fm API error: {data.get('message', 'Unknown error')}")

        return data['session']['key'], data['session']['name']

    async def get_user_info(self, username: str) -> Dict:
        """Get basic user info"""
        params = {
            'method': 'user.getInfo',
            'user': username,
            'api_key': self.api_key,
            'format': 'json'
        }
        data = await self._request(params)
        if 'error' in data:
            raise Exception(f"User not found: {data.get('message', 'Unknown error')}")
        return data.get('user', {})

    async def get_user_top_artists(
        self, 
        username: str, 
        limit: int = 50, 
        period: str = 'overall'
    ) -> List[Artist]:
        """Get user's top artists for a specific time period"""
        params = {
            'method': 'user.getTopArtists',
            'user': username,
            'api_key': self.api_key,
            'limit': limit,
            'period': period,
            'format': 'json'
        }
        data = await self._request(params)
        if 'error' in data:
            return []

        return [
            Artist(
                name=artist.get('name', ''),
                playcount=int(artist.get('playcount', 0)),
                mbid=artist.get('mbid') or None
            )
            for artist in data.get('topartists', {}).get('artist', [])
        ]

    async def get_user_top_tracks(
        self, 
        username: str, 
        limit: int = 50, 
        period: str = 'overall',
        enrich_count: int = 5
    ) -> List[Track]:
        """
        Get user's top tracks with concurrent image enrichment
        
        Args:
            enrich_count: Number of tracks to enrich with album art (default: 5)
        """
        params = {
            'method': 'user.getTopTracks',
            'user': username,
            'api_key': self.api_key,
            'limit': limit,
            'period': period,
            'format': 'json'
        }
        data = await self._request(params)
        if 'error' in data:
            return []

        top_tracks = data.get('toptracks', {}).get('track', [])
        result = []
        tracks_to_enrich = []

        # First pass: create Track objects
        for idx, track in enumerate(top_tracks):
            image_url = self._extract_image_url(track.get('image', []))
            artist_name = (
                track.get('artist', {}).get('name', '') 
                if isinstance(track.get('artist'), dict) 
                else ''
            )
            
            track_obj = Track(
                name=track.get('name', ''),
                artist=artist_name,
                playcount=int(track.get('playcount', 0)),
                mbid=track.get('mbid') or None,
                image=image_url
            )
            result.append(track_obj)

            # Collect tracks needing enrichment
            if not image_url and idx < enrich_count:
                tracks_to_enrich.append((idx, artist_name, track.get('name', '')))

        # Concurrent enrichment - all requests in parallel!
        if tracks_to_enrich:
            enrichment_tasks = [
                self.get_track_info(artist, track_name)
                for _, artist, track_name in tracks_to_enrich
            ]
            enrichment_results = await asyncio.gather(*enrichment_tasks, return_exceptions=True)

            for (idx, artist, track_name), info in zip(tracks_to_enrich, enrichment_results):
                if isinstance(info, Exception):
                    continue
                if info and info.get('image'):
                    result[idx].image = info['image']

        return result

    async def get_recent_tracks(self, username: str, limit: int = 1000) -> List[RecentTrack]:
        """Get user's recent tracks"""
        params = {
            'method': 'user.getRecentTracks',
            'user': username,
            'api_key': self.api_key,
            'limit': limit,
            'format': 'json'
        }
        data = await self._request(params)
        if 'error' in data:
            return []

        return [
            RecentTrack(
                name=track.get('name', ''),
                artist=(
                    track.get('artist', {}).get('#text', '') 
                    if isinstance(track.get('artist'), dict) 
                    else track.get('artist', '')
                ),
                album=(
                    track.get('album', {}).get('#text', '') 
                    if isinstance(track.get('album'), dict) 
                    else None
                ),
                image=self._extract_image_url(track.get('image', [])),
                timestamp=(
                    None if track.get('@attr', {}).get('nowplaying') == 'true'
                    else int(track.get('date', {}).get('uts', 0)) if 'date' in track else None
                ),
                nowplaying=track.get('@attr', {}).get('nowplaying') == 'true'
            )
            for track in data.get('recenttracks', {}).get('track', [])
        ]

    async def get_track_info(self, artist: str, track: str) -> Optional[Dict]:
        """Get track info with caching"""
        cache_key = f"{artist.lower()}|{track.lower()}"
        
        # Check cache first
        if cache_key in self._track_info_cache:
            return self._track_info_cache[cache_key]

        params = {
            'method': 'track.getInfo',
            'artist': artist,
            'track': track,
            'api_key': self.api_key,
            'format': 'json'
        }

        try:
            data = await self._request(params)
            if 'error' in data or 'track' not in data:
                return None

            track_data = data.get('track', {})
            album = track_data.get('album', {})
            
            result = {
                'image': self._extract_image_url(album.get('image', [])),
                'album': album.get('title')
            }
            
            # Cache the result
            self._track_info_cache[cache_key] = result
            return result
            
        except Exception:
            return None

    async def get_artist_top_tags(self, artist: str, limit: int = 5) -> List[str]:
        """Get artist tags with caching"""
        cache_key = artist.lower()
        
        # Check cache first
        if cache_key in self._artist_tags_cache:
            return self._artist_tags_cache[cache_key]

        params = {
            'method': 'artist.getTopTags',
            'artist': artist,
            'api_key': self.api_key,
            'limit': limit,
            'format': 'json'
        }

        data = await self._request(params)
        if 'error' in data:
            return []

        tags = [
            tag.get('name', '').lower() 
            for tag in data.get('toptags', {}).get('tag', []) 
            if tag.get('name')
        ]
        
        # Cache the result
        self._artist_tags_cache[cache_key] = tags
        return tags

    async def get_artist_tags_batch(self, artists: List[str], limit: int = 5) -> Dict[str, List[str]]:
        """
        Fetch tags for multiple artists concurrently
        Much faster than sequential fetching!
        """
        # Filter out cached artists
        uncached = [a for a in artists if a.lower() not in self._artist_tags_cache]
        cached_results = {a: self._artist_tags_cache[a.lower()] for a in artists if a.lower() in self._artist_tags_cache}

        if uncached:
            # Fetch all uncached artists concurrently
            tasks = [self.get_artist_top_tags(artist, limit) for artist in uncached]
            results = await asyncio.gather(*tasks, return_exceptions=True)

            for artist, result in zip(uncached, results):
                if isinstance(result, Exception):
                    cached_results[artist] = []
                else:
                    cached_results[artist] = result

        return cached_results

    async def get_user_profile(self, username: str) -> UserProfile:
        """
        Get comprehensive user profile from Last.fm (simple version for dashboard)
        Fetches overall period only with concurrent enrichment
        """
        # Fetch all data in parallel
        user_info_task = self.get_user_info(username)
        top_artists_task = self.get_user_top_artists(username, limit=50)
        top_tracks_task = self.get_user_top_tracks(username, limit=50, enrich_count=5)
        recent_tracks_task = self.get_recent_tracks(username, limit=200)

        user_info, top_artists, top_tracks, recent_tracks = await asyncio.gather(
            user_info_task,
            top_artists_task,
            top_tracks_task,
            recent_tracks_task,
            return_exceptions=True
        )

        # Handle exceptions
        if isinstance(user_info, Exception):
            raise user_info
        if isinstance(top_artists, Exception):
            top_artists = []
        if isinstance(top_tracks, Exception):
            top_tracks = []
        if isinstance(recent_tracks, Exception):
            recent_tracks = []

        # Extract basic info
        playcount = int(user_info.get('playcount', 0))
        url = user_info.get('url', '')
        country = user_info.get('country', '')
        real_name = user_info.get('realname')

        # Get profile image
        images = user_info.get('image', [])
        image = None
        if images:
            # Try to get large image
            for img in images:
                if img.get('size') == 'large' and img.get('#text'):
                    image = img['#text']
                    break
            # Fallback to any image
            if not image:
                for img in images:
                    if img.get('#text'):
                        image = img['#text']
                        break

        # Get registered timestamp
        registered = None
        if 'registered' in user_info:
            registered = int(user_info['registered'].get('unixtime', 0))

        return UserProfile(
            username=username,
            real_name=real_name,
            country=country,
            playcount=playcount,
            registered=registered,
            url=url,
            image=image,
            top_artists=top_artists,
            top_tracks=top_tracks,
            recent_tracks=recent_tracks
        )

    async def get_user_profile_multi_period(self, username: str) -> Dict:
        """
        Get comprehensive user profile - FULLY PARALLELIZED
        
        All API calls happen concurrently, then enrichment happens concurrently.
        Should be 5-10x faster than sequential approach.
        """
        # Phase 1: All primary data fetched in parallel (8 concurrent requests)
        primary_tasks = [
            self.get_user_info(username),
            self.get_user_top_artists(username, limit=50, period='overall'),
            self.get_user_top_artists(username, limit=50, period='6month'),
            self.get_user_top_artists(username, limit=30, period='3month'),
            self.get_user_top_tracks(username, limit=50, period='overall', enrich_count=0),  # No enrichment yet
            self.get_user_top_tracks(username, limit=50, period='6month', enrich_count=0),
            self.get_user_top_tracks(username, limit=30, period='3month', enrich_count=0),
            self.get_recent_tracks(username, limit=200)
        ]

        results = await asyncio.gather(*primary_tasks, return_exceptions=True)

        user_info = results[0]
        if isinstance(user_info, Exception):
            raise user_info

        artists_overall = results[1] if not isinstance(results[1], Exception) else []
        artists_6month = results[2] if not isinstance(results[2], Exception) else []
        artists_3month = results[3] if not isinstance(results[3], Exception) else []
        tracks_overall = results[4] if not isinstance(results[4], Exception) else []
        tracks_6month = results[5] if not isinstance(results[5], Exception) else []
        tracks_3month = results[6] if not isinstance(results[6], Exception) else []
        recent_tracks = results[7] if not isinstance(results[7], Exception) else []

        # Phase 2: Enrichment in parallel
        # - Artist tags for top 10 artists
        # - Track images for top 5 tracks of each period
        
        enrichment_tasks = []
        
        # Artist tags (single batch call)
        top_artist_names = [a.name for a in artists_overall[:10]]
        artist_tags_task = self.get_artist_tags_batch(top_artist_names, limit=5)
        
        # Track enrichment for tracks without images
        track_enrichment_specs = []  # (period, idx, artist, track_name)
        
        for period_name, tracks in [('overall', tracks_overall), ('6month', tracks_6month), ('3month', tracks_3month)]:
            for idx, track in enumerate(tracks[:5]):
                if not track.image:
                    track_enrichment_specs.append((period_name, idx, track.artist, track.name))

        # Fetch all track info concurrently
        track_info_tasks = [
            self.get_track_info(artist, track_name) 
            for _, _, artist, track_name in track_enrichment_specs
        ]

        # Run all enrichment concurrently
        all_enrichment = await asyncio.gather(
            artist_tags_task,
            *track_info_tasks,
            return_exceptions=True
        )

        # Process artist tags
        artist_tags = all_enrichment[0] if not isinstance(all_enrichment[0], Exception) else {}

        # Process track images
        track_lists = {
            'overall': tracks_overall,
            '6month': tracks_6month,
            '3month': tracks_3month
        }
        
        for spec, info in zip(track_enrichment_specs, all_enrichment[1:]):
            if isinstance(info, Exception) or not info:
                continue
            period_name, idx, _, _ = spec
            if info.get('image'):
                track_lists[period_name][idx].image = info['image']

        # Build response
        playcount = int(user_info.get('playcount', 0))
        images = user_info.get('image', [])
        image = None
        for img in images:
            if img.get('size') == 'large' and img.get('#text'):
                image = img['#text']
                break
        if not image:
            for img in images:
                if img.get('#text'):
                    image = img['#text']
                    break

        registered = None
        if 'registered' in user_info:
            registered = int(user_info['registered'].get('unixtime', 0))

        return {
            'username': username,
            'real_name': user_info.get('realname'),
            'country': user_info.get('country', ''),
            'playcount': playcount,
            'registered': registered,
            'url': user_info.get('url', ''),
            'image': image,
            'artists': {
                'overall': artists_overall,
                '6month': artists_6month,
                '3month': artists_3month
            },
            'tracks': {
                'overall': tracks_overall,
                '6month': tracks_6month,
                '3month': tracks_3month
            },
            'recent_tracks': recent_tracks,
            'artist_tags': artist_tags
        }

    def clear_cache(self):
        """Clear all caches"""
        self._artist_tags_cache.clear()
        self._track_info_cache.clear()


# Singleton instance
lastfm_async_service = LastFMAsyncService()
