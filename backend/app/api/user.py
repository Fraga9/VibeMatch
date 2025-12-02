from fastapi import APIRouter, HTTPException, Depends, Query
from app.models.schemas import (
    UserProfile,
    UserEmbeddingRequest,
    UserEmbeddingResponse
)
from app.services.lastfm import lastfm_service
from app.services.lastfm_async import lastfm_async_service
from app.services.embedding import embedding_service
from app.services.qdrant_service import qdrant_service
from app.core.security import get_current_user
from datetime import datetime

router = APIRouter(prefix="/user", tags=["User"])


@router.get("/profile", response_model=UserProfile)
async def get_user_profile(
    username: str = Query(..., description="Last.fm username"),
    current_user: str = Depends(get_current_user)
):
    """
    Get comprehensive Last.fm user profile

    Returns:
    - Basic user info
    - Top 50 artists (overall)
    - Top 50 tracks (overall)
    - Recent scrobbles
    """
    try:
        # IMPORTANT: Last.fm usernames are case-insensitive, normalize to lowercase
        username = username.lower().strip()

        profile = await lastfm_async_service.get_user_profile(username)
        return profile

    except Exception as e:
        raise HTTPException(
            status_code=404,
            detail=f"Failed to fetch user profile: {str(e)}"
        )


@router.post("/embedding", response_model=UserEmbeddingResponse)
async def create_user_embedding(
    current_user: str = Depends(get_current_user)
):
    """
    Generate and store user embedding in Qdrant (Enhanced multi-period)

    Steps:
    1. Fetch user's Last.fm profile across multiple time periods
    2. Fetch genre tags for top 10 artists
    3. Generate embedding using temporal weighting
    4. Store in Qdrant with metadata
    5. Return embedding info

    This endpoint should be called after authentication to enable matching
    """
    try:
        # Fetch multi-period user profile from Last.fm
        profile_data = await lastfm_async_service.get_user_profile_multi_period(current_user)

        # Generate embedding from multi-period profile
        embedding = embedding_service.generate_user_embedding_temporal(profile_data)

        # Infer genres from Last.fm tags
        top_artist_names = [a.name for a in profile_data['artists']['overall'][:10]]
        top_genres = embedding_service.infer_genres_from_tags(
            profile_data.get('artist_tags', {}),
            top_artist_names
        )

        # Store in Qdrant
        user_id = qdrant_service.add_user_embedding(
            username=current_user,
            embedding=embedding.tolist(),
            top_artists=top_artist_names,
            is_real=True,
            country=profile_data.get('country'),
            profile_image=profile_data.get('image'),
            top_genres=top_genres
        )

        return UserEmbeddingResponse(
            user_id=user_id,
            username=current_user,
            embedding_dim=len(embedding),
            top_artists=top_artist_names,
            created_at=datetime.utcnow()
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create user embedding: {str(e)}"
        )


@router.get("/embedding/status")
async def get_embedding_status(current_user: str = Depends(get_current_user)):
    """
    Check if user has an embedding stored in Qdrant
    """
    try:
        user_data = qdrant_service.get_user_by_username(current_user)

        if user_data:
            return {
                "has_embedding": True,
                "user_id": user_data["user_id"],
                "top_artists": user_data.get("top_artists", [])
            }
        else:
            return {
                "has_embedding": False,
                "message": "Please create your embedding first by calling POST /user/embedding"
            }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to check embedding status: {str(e)}"
        )
