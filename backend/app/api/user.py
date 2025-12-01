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
    Generate and store user embedding in Qdrant

    Steps:
    1. Fetch user's Last.fm profile (top artists/tracks)
    2. Generate embedding using GNN model
    3. Store in Qdrant with metadata
    4. Return embedding info

    This endpoint should be called after authentication to enable matching
    """
    try:
        # Fetch user profile from Last.fm
        profile = await lastfm_async_service.get_user_profile(current_user)

        # Generate embedding from profile
        embedding = embedding_service.generate_user_embedding(profile)

        # Infer genres from top artists
        top_genres = embedding_service.infer_genres_from_artists(
            [a.name for a in profile.top_artists[:20]]
        )

        # Store in Qdrant
        user_id = qdrant_service.add_user_embedding(
            username=current_user,
            embedding=embedding.tolist(),
            top_artists=[a.name for a in profile.top_artists[:10]],
            is_real=True,
            country=profile.country,
            profile_image=profile.image,
            top_genres=top_genres
        )

        return UserEmbeddingResponse(
            user_id=user_id,
            username=current_user,
            embedding_dim=len(embedding),
            top_artists=[a.name for a in profile.top_artists[:10]],
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
