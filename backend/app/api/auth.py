from fastapi import APIRouter, HTTPException, Depends
from app.models.schemas import LastFMAuthRequest, LastFMAuthResponse, Token
from app.services.lastfm import lastfm_service
from app.services.lastfm_async import lastfm_async_service
from app.core.security import create_access_token
from datetime import timedelta
from app.core.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/lastfm", response_model=Token)
async def authenticate_lastfm(auth_request: LastFMAuthRequest):
    """
    Authenticate user with Last.fm token and return JWT access token

    Flow:
    1. Frontend redirects user to Last.fm OAuth
    2. Last.fm returns with token
    3. This endpoint exchanges token for session key
    4. Returns JWT token for subsequent API calls
    """
    try:
        # Exchange token for session key and get username
        session_key, username = await lastfm_service.get_session_key(auth_request.token)

        # Create JWT token
        access_token = create_access_token(
            data={"sub": username, "session_key": session_key},
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        )

        return Token(
            access_token=access_token,
            token_type="bearer"
        )

    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail=f"Authentication failed: {str(e)}"
        )


@router.get("/lastfm/authorize-url")
async def get_lastfm_authorize_url():
    """
    Get Last.fm authorization URL for OAuth flow

    Returns the URL to redirect users to for Last.fm authentication
    """
    base_url = "http://www.last.fm/api/auth/"
    auth_url = f"{base_url}?api_key={settings.LASTFM_API_KEY}&cb={settings.LASTFM_CALLBACK_URL}"

    return {
        "authorize_url": auth_url,
        "callback_url": settings.LASTFM_CALLBACK_URL
    }


@router.post("/simple", response_model=Token)
async def simple_authenticate(username: str):
    """
    Simple authentication with just Last.fm username (no OAuth required)

    This uses public Last.fm API data and is perfect for read-only access.
    No need for OAuth flow - just provide a Last.fm username.

    Args:
        username: Last.fm username (e.g., "RJ", "musiclover123")

    Returns:
        JWT token for accessing the API
    """
    try:
        # Verify user exists on Last.fm by fetching their basic info
        user_info = await lastfm_async_service.get_user_info(username)

        if not user_info:
            raise HTTPException(
                status_code=404,
                detail=f"Last.fm user '{username}' not found"
            )

        # Create JWT token (no session_key needed for public data)
        access_token = create_access_token(
            data={"sub": username},
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        )

        return Token(
            access_token=access_token,
            token_type="bearer"
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to authenticate: {str(e)}"
        )
