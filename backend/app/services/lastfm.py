import pylast
import httpx
from typing import List, Dict, Optional
from app.core.config import settings
from app.models.schemas import Artist, Track, RecentTrack, UserProfile


class LastFMService:
    """Service for interacting with Last.fm API"""

    def __init__(self):
        self.api_key = settings.LASTFM_API_KEY
        self.api_secret = settings.LASTFM_API_SECRET
        self.network = pylast.LastFMNetwork(
            api_key=self.api_key,
            api_secret=self.api_secret
        )

    async def get_session_key(self, token: str) -> tuple[str, str]:
        """
        Exchange Last.fm auth token for session key
        Returns: (session_key, username)
        """
        try:
            session_key = self.network.get_session_key(token)
            # Get username from session
            auth_network = pylast.LastFMNetwork(
                api_key=self.api_key,
                api_secret=self.api_secret,
                session_key=session_key
            )
            user = auth_network.get_authenticated_user()
            username = user.get_name()
            return session_key, username
        except Exception as e:
            raise Exception(f"Failed to authenticate with Last.fm: {str(e)}")

    async def get_user_profile(self, username: str) -> UserProfile:
        """Get comprehensive user profile from Last.fm"""
        try:
            user = self.network.get_user(username)

            # Get basic info
            playcount = user.get_playcount()
            url = user.get_url()
            country = user.get_country()

            # Get profile image
            try:
                image = user.get_image()
            except:
                image = None

            # Get registered timestamp
            try:
                registered = int(user.get_registered())
            except:
                registered = None

            # Get top artists (overall, limit 50)
            top_artists_data = user.get_top_artists(limit=50, period=pylast.PERIOD_OVERALL)
            top_artists = [
                Artist(
                    name=item.item.get_name(),
                    playcount=int(item.weight) if item.weight else 0,
                    mbid=item.item.get_mbid() if hasattr(item.item, 'get_mbid') else None
                )
                for item in top_artists_data
            ]

            # Get top tracks (overall, limit 50)
            top_tracks_data = user.get_top_tracks(limit=50, period=pylast.PERIOD_OVERALL)
            top_tracks = [
                Track(
                    name=item.item.get_name(),
                    artist=item.item.get_artist().get_name(),
                    playcount=int(item.weight) if item.weight else 0,
                    mbid=item.item.get_mbid() if hasattr(item.item, 'get_mbid') else None
                )
                for item in top_tracks_data
            ]

            # Get recent tracks (last 1000)
            recent_tracks_data = user.get_recent_tracks(limit=1000)
            recent_tracks = []
            for track in recent_tracks_data:
                try:
                    nowplaying = hasattr(track, 'nowplaying') and track.nowplaying
                    timestamp = None
                    if hasattr(track, 'timestamp') and not nowplaying:
                        timestamp = int(track.timestamp)

                    recent_tracks.append(RecentTrack(
                        name=track.track.get_name(),
                        artist=track.track.get_artist().get_name(),
                        album=track.track.get_album().get_name() if hasattr(track.track, 'get_album') and track.track.get_album() else None,
                        timestamp=timestamp,
                        nowplaying=nowplaying
                    ))
                except:
                    continue

            return UserProfile(
                username=username,
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

    async def get_global_top_users(self, limit: int = 100) -> List[str]:
        """Get global top scrobblers (for ghost seeding)"""
        # Note: Last.fm doesn't have a direct API for this
        # This is a placeholder - in production, use a curated list or scrape from charts
        return []

    async def search_users_by_tag(self, tag: str, limit: int = 50) -> List[str]:
        """Search for users who listen to a specific tag/genre"""
        try:
            tag_obj = self.network.get_tag(tag)
            top_artists = tag_obj.get_top_artists(limit=10)

            # Get listeners from top artists in this tag
            usernames = set()
            for artist_item in top_artists:
                try:
                    artist = artist_item.item
                    # This is a workaround - Last.fm API is limited here
                    # In production, you'd maintain a database of users by genre
                    pass
                except:
                    continue

            return list(usernames)[:limit]

        except Exception as e:
            print(f"Error searching users by tag {tag}: {str(e)}")
            return []


# Singleton instance
lastfm_service = LastFMService()
