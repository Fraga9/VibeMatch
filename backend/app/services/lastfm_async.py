import httpx
import hashlib
from typing import List, Dict, Optional
from app.core.config import settings
from app.models.schemas import Artist, Track, RecentTrack, UserProfile


class LastFMAsyncService:
    """Async service for interacting with Last.fm API using httpx"""

    def __init__(self):
        self.api_key = settings.LASTFM_API_KEY
        self.api_secret = settings.LASTFM_API_SECRET
        self.base_url = "http://ws.audioscrobbler.com/2.0/"

    def _generate_signature(self, params: Dict) -> str:
        """Generate API signature for authenticated requests"""
        # Sort params alphabetically
        sorted_params = sorted(params.items())
        # Create signature string
        sig_string = ''.join([f"{k}{v}" for k, v in sorted_params if k != 'format'])
        sig_string += self.api_secret
        # Return MD5 hash
        return hashlib.md5(sig_string.encode('utf-8')).hexdigest()

    async def get_session_key(self, token: str) -> tuple[str, str]:
        """
        Exchange Last.fm auth token for session key
        Returns: (session_key, username)
        """
        params = {
            'method': 'auth.getSession',
            'api_key': self.api_key,
            'token': token,
        }
        params['api_sig'] = self._generate_signature(params)
        params['format'] = 'json'

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(self.base_url, params=params)
            data = response.json()

            if 'error' in data:
                raise Exception(f"Last.fm API error: {data.get('message', 'Unknown error')}")

            session_key = data['session']['key']
            username = data['session']['name']
            return session_key, username

    async def get_user_info(self, username: str) -> Dict:
        """Get basic user info"""
        params = {
            'method': 'user.getInfo',
            'user': username,
            'api_key': self.api_key,
            'format': 'json'
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(self.base_url, params=params)
            data = response.json()

            if 'error' in data:
                raise Exception(f"User not found or API error: {data.get('message', 'Unknown error')}")

            return data.get('user', {})

    async def get_user_top_artists(self, username: str, limit: int = 50) -> List[Artist]:
        """Get user's top artists"""
        params = {
            'method': 'user.getTopArtists',
            'user': username,
            'api_key': self.api_key,
            'limit': limit,
            'period': 'overall',
            'format': 'json'
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(self.base_url, params=params)
            data = response.json()

            if 'error' in data:
                return []

            top_artists = data.get('topartists', {}).get('artist', [])

            return [
                Artist(
                    name=artist.get('name', ''),
                    playcount=int(artist.get('playcount', 0)),
                    mbid=artist.get('mbid') if artist.get('mbid') else None
                )
                for artist in top_artists
            ]

    async def get_user_top_tracks(self, username: str, limit: int = 50) -> List[Track]:
        """Get user's top tracks"""
        params = {
            'method': 'user.getTopTracks',
            'user': username,
            'api_key': self.api_key,
            'limit': limit,
            'period': 'overall',
            'format': 'json'
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(self.base_url, params=params)
            data = response.json()

            if 'error' in data:
                return []

            top_tracks = data.get('toptracks', {}).get('track', [])

            return [
                Track(
                    name=track.get('name', ''),
                    artist=track.get('artist', {}).get('name', '') if isinstance(track.get('artist'), dict) else '',
                    playcount=int(track.get('playcount', 0)),
                    mbid=track.get('mbid') if track.get('mbid') else None
                )
                for track in top_tracks
            ]

    async def get_recent_tracks(self, username: str, limit: int = 1000) -> List[RecentTrack]:
        """Get user's recent tracks"""
        params = {
            'method': 'user.getRecentTracks',
            'user': username,
            'api_key': self.api_key,
            'limit': limit,
            'format': 'json'
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(self.base_url, params=params)
            data = response.json()

            if 'error' in data:
                return []

            recent_tracks = data.get('recenttracks', {}).get('track', [])

            result = []
            for track in recent_tracks:
                # Check if currently playing
                nowplaying = track.get('@attr', {}).get('nowplaying') == 'true'

                # Get timestamp
                timestamp = None
                if not nowplaying and 'date' in track:
                    timestamp = int(track['date'].get('uts', 0))

                result.append(RecentTrack(
                    name=track.get('name', ''),
                    artist=track.get('artist', {}).get('#text', '') if isinstance(track.get('artist'), dict) else track.get('artist', ''),
                    album=track.get('album', {}).get('#text', '') if isinstance(track.get('album'), dict) else None,
                    timestamp=timestamp,
                    nowplaying=nowplaying
                ))

            return result

    async def get_user_profile(self, username: str) -> UserProfile:
        """Get comprehensive user profile from Last.fm"""
        try:
            # Fetch all data in parallel
            import asyncio

            user_info_task = self.get_user_info(username)
            top_artists_task = self.get_user_top_artists(username, limit=50)
            top_tracks_task = self.get_user_top_tracks(username, limit=50)
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

        except Exception as e:
            raise Exception(f"Failed to fetch user profile: {str(e)}")


# Singleton instance
lastfm_async_service = LastFMAsyncService()
