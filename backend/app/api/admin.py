from fastapi import APIRouter, HTTPException, Header
from app.models.schemas import SeedGhostUsersRequest, SeedGhostUsersResponse
from app.core.security import verify_admin_key
from app.services.qdrant_service import qdrant_service
from typing import Optional

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.post("/seed/ghosts", response_model=SeedGhostUsersResponse)
async def seed_ghost_users(
    request: SeedGhostUsersRequest,
    x_admin_key: str = Header(..., description="Admin API key")
):
    """
    Seed Qdrant with ghost users (diverse, public Last.fm users)

    Admin-only endpoint. Requires X-Admin-Key header.

    Distribution:
    - 40% top global scrobblers
    - 30% niche genres (vaporwave, hyperpop, cumbia, etc.)
    - 20% users with 10+ years history
    - 10% non-English speaking countries

    This should be run once initially and can be re-run to refresh.
    """
    # Verify admin key
    if not verify_admin_key(x_admin_key):
        raise HTTPException(status_code=403, detail="Invalid admin API key")

    try:
        # If force_reseed, delete existing ghosts
        if request.force_reseed:
            deleted = qdrant_service.delete_all_ghost_users()
            print(f"Deleted {deleted} existing ghost users")

        # Import here to avoid circular dependency
        from app.utils.ghost_seeder import GhostUserSeeder

        seeder = GhostUserSeeder()
        users_created = await seeder.seed_ghost_users(count=request.count)

        return SeedGhostUsersResponse(
            status="success",
            users_created=users_created,
            message=f"Successfully seeded {users_created} ghost users"
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to seed ghost users: {str(e)}"
        )


@router.get("/stats")
async def get_admin_stats(x_admin_key: str = Header(..., description="Admin API key")):
    """
    Get detailed admin statistics

    Admin-only endpoint.
    """
    if not verify_admin_key(x_admin_key):
        raise HTTPException(status_code=403, detail="Invalid admin API key")

    try:
        total_users = qdrant_service.count_users()
        real_users = qdrant_service.count_users(is_real=True)
        ghost_users = qdrant_service.count_users(is_real=False)

        return {
            "total_users": total_users,
            "real_users": real_users,
            "ghost_users": ghost_users,
            "ghost_percentage": (ghost_users / total_users * 100) if total_users > 0 else 0
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get admin stats: {str(e)}"
        )


@router.post("/clean/duplicates")
async def clean_duplicate_users(x_admin_key: str = Header(..., description="Admin API key")):
    """
    Clean duplicate user entries in Qdrant

    Keeps only the most recent entry for each username and deletes older duplicates.
    Admin-only endpoint.
    """
    if not verify_admin_key(x_admin_key):
        raise HTTPException(status_code=403, detail="Invalid admin API key")

    try:
        deleted_count = qdrant_service.clean_duplicate_users()

        return {
            "status": "success",
            "deleted_count": deleted_count,
            "message": f"Cleaned {deleted_count} duplicate user entries"
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to clean duplicates: {str(e)}"
        )


@router.post("/initialize/indexes")
async def initialize_indexes(x_admin_key: str = Header(..., description="Admin API key")):
    """
    Initialize/ensure payload indexes in Qdrant collection

    Creates indexes for 'username' and 'is_real' fields to enable filtering.
    Safe to run multiple times - will skip if indexes already exist.
    Admin-only endpoint.
    """
    if not verify_admin_key(x_admin_key):
        raise HTTPException(status_code=403, detail="Invalid admin API key")

    try:
        success = qdrant_service.ensure_indexes()

        if success:
            return {
                "status": "success",
                "message": "Payload indexes created/verified successfully"
            }
        else:
            raise HTTPException(
                status_code=500,
                detail="Failed to create indexes"
            )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to initialize indexes: {str(e)}"
        )
