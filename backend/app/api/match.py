from fastapi import APIRouter, HTTPException, Depends, Query
from app.models.schemas import MatchResult, TopMatchesResponse
from app.services.qdrant_service import qdrant_service
from app.services.lastfm import lastfm_service
from app.core.security import get_current_user
from typing import List

router = APIRouter(prefix="/match", tags=["Matching"])


@router.get("/top", response_model=TopMatchesResponse)
async def get_top_matches(
    limit: int = Query(20, ge=1, le=100, description="Number of matches to return"),
    current_user: str = Depends(get_current_user)
):
    """
    Get top matching users based on music taste similarity

    Returns:
    - Similar users (both real and ghost)
    - Similarity scores (0-1)
    - Shared artists and tracks
    - Compatibility percentage

    User must have created their embedding first (POST /user/embedding)
    """
    try:
        # Get current user's embedding from Qdrant
        user_data = qdrant_service.get_user_by_username(current_user)

        if not user_data:
            raise HTTPException(
                status_code=404,
                detail="User embedding not found. Please create your embedding first with POST /user/embedding"
            )

        user_id = user_data["user_id"]
        user_embedding = user_data["embedding"]
        user_top_artists = set(user_data.get("top_artists", []))

        # Find similar users
        similar_users = qdrant_service.find_similar_users(
            embedding=user_embedding,
            limit=limit,
            exclude_user_id=user_id
        )

        # If no matches found, return empty list
        if not similar_users:
            return TopMatchesResponse(
                matches=[],
                total_count=0
            )

        # Build match results with shared content
        matches = []
        for match in similar_users:
            match_artists = set(match.get("top_artists", []))
            shared_artists = list(user_top_artists.intersection(match_artists))

            # Calculate compatibility score (0-100)
            compatibility = int(match["similarity"] * 100)

            # For real users, we could fetch more details
            # For ghost users, we use stored metadata
            match_result = MatchResult(
                user_id=match["user_id"] if not match["is_real"] else None,
                username=match["username"] if match["is_real"] else None,
                similarity=match["similarity"],
                is_real=match["is_real"],
                shared_artists=shared_artists[:10],
                shared_tracks=[],  # Could be computed with more detail
                top_genres=match.get("top_genres", []),
                profile_image=match.get("profile_image"),
                country=match.get("country"),
                compatibility_score=compatibility
            )
            matches.append(match_result)

        return TopMatchesResponse(
            matches=matches,
            total_count=len(matches)
        )

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"Error finding matches: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Failed to find matches: {str(e)}"
        )


@router.get("/stats")
async def get_matching_stats(current_user: str = Depends(get_current_user)):
    """
    Get statistics about the matching pool

    Returns:
    - Total users in database
    - Real users count
    - Ghost users count
    """
    try:
        total_users = qdrant_service.count_users()
        real_users = qdrant_service.count_users(is_real=True)
        ghost_users = qdrant_service.count_users(is_real=False)

        return {
            "total_users": total_users,
            "real_users": real_users,
            "ghost_users": ghost_users,
            "message": f"You can be matched with {total_users - 1} other users"
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get stats: {str(e)}"
        )
