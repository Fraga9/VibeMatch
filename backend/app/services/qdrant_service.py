from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue
from typing import List, Dict, Optional
import uuid
from datetime import datetime
from app.core.config import settings


class QdrantService:
    """Service for interacting with Qdrant vector database"""

    def __init__(self):
        # Configure Qdrant client for both local and cloud
        if settings.QDRANT_API_KEY:
            # Qdrant Cloud configuration
            self.client = QdrantClient(
                url=f"https://{settings.QDRANT_HOST}:{settings.QDRANT_PORT}",
                api_key=settings.QDRANT_API_KEY,
            )
        else:
            # Local Qdrant configuration
            self.client = QdrantClient(
                host=settings.QDRANT_HOST,
                port=settings.QDRANT_PORT,
                https=settings.QDRANT_USE_HTTPS
            )
        self.collection_name = settings.QDRANT_COLLECTION_USERS
        self.vector_size = settings.QDRANT_VECTOR_SIZE
        self._ensure_collection()

    def _ensure_collection(self):
        """Create collection if it doesn't exist"""
        try:
            collections = self.client.get_collections().collections
            collection_names = [c.name for c in collections]

            if self.collection_name not in collection_names:
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=VectorParams(
                        size=self.vector_size,
                        distance=Distance.COSINE
                    )
                )
                print(f"Created Qdrant collection: {self.collection_name}")
        except Exception as e:
            print(f"Error ensuring collection: {str(e)}")

    def add_user_embedding(
        self,
        username: str,
        embedding: List[float],
        top_artists: List[str],
        is_real: bool = True,
        country: Optional[str] = None,
        profile_image: Optional[str] = None,
        top_genres: Optional[List[str]] = None
    ) -> str:
        """Add or update user embedding in Qdrant"""
        try:
            # IMPORTANT: Last.fm usernames are case-insensitive, normalize to lowercase
            username = username.lower().strip()

            # Check if user already exists
            existing_user = self.get_user_by_username(username)

            if existing_user:
                # User exists - update with existing ID
                user_id = existing_user["user_id"]
                print(f"Updating existing user: {username} (ID: {user_id})")
            else:
                # New user - generate new ID
                user_id = str(uuid.uuid4())
                print(f"Creating new user: {username} (ID: {user_id})")

            payload = {
                "username": username,
                "is_real": is_real,
                "top_artists": top_artists[:10],  # Store top 10
                "country": country,
                "profile_image": profile_image,
                "top_genres": top_genres or [],
                "created_at": existing_user["created_at"] if existing_user and "created_at" in existing_user else datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }

            point = PointStruct(
                id=user_id,
                vector=embedding,
                payload=payload
            )

            self.client.upsert(
                collection_name=self.collection_name,
                points=[point]
            )

            return user_id

        except Exception as e:
            raise Exception(f"Failed to add user embedding: {str(e)}")

    def find_similar_users(
        self,
        embedding: List[float],
        limit: int = 20,
        exclude_user_id: Optional[str] = None
    ) -> List[Dict]:
        """Find similar users based on embedding"""
        try:
            # Use query_points for newer versions of qdrant-client
            from qdrant_client.models import QueryRequest, ScoredPoint

            search_result = self.client.query_points(
                collection_name=self.collection_name,
                query=embedding,
                limit=limit + 1,  # +1 to account for potential self-match
                with_payload=True
            )

            results = []
            # Handle both old and new response formats
            points = search_result.points if hasattr(search_result, 'points') else search_result

            for hit in points:
                # Skip if this is the user themselves
                if exclude_user_id and str(hit.id) == exclude_user_id:
                    continue

                results.append({
                    "user_id": str(hit.id),
                    "similarity": float(hit.score),
                    "username": hit.payload.get("username"),
                    "is_real": hit.payload.get("is_real", True),
                    "top_artists": hit.payload.get("top_artists", []),
                    "country": hit.payload.get("country"),
                    "profile_image": hit.payload.get("profile_image"),
                    "top_genres": hit.payload.get("top_genres", [])
                })

            return results[:limit]

        except Exception as e:
            raise Exception(f"Failed to find similar users: {str(e)}")

    def get_user_by_username(self, username: str) -> Optional[Dict]:
        """Get user by username (case-insensitive)"""
        try:
            # IMPORTANT: Last.fm usernames are case-insensitive, normalize to lowercase
            username = username.lower().strip()

            search_result = self.client.scroll(
                collection_name=self.collection_name,
                scroll_filter=Filter(
                    must=[
                        FieldCondition(
                            key="username",
                            match=MatchValue(value=username)
                        )
                    ]
                ),
                limit=1,
                with_payload=True,
                with_vectors=True
            )

            if search_result[0]:
                point = search_result[0][0]
                return {
                    "user_id": str(point.id),
                    "username": point.payload.get("username"),
                    "embedding": point.vector,
                    "is_real": point.payload.get("is_real", True),
                    "top_artists": point.payload.get("top_artists", []),
                    "country": point.payload.get("country"),
                    "profile_image": point.payload.get("profile_image"),
                    "created_at": point.payload.get("created_at"),
                    "updated_at": point.payload.get("updated_at")
                }

            return None

        except Exception as e:
            print(f"Error getting user by username: {str(e)}")
            return None

    def count_users(self, is_real: Optional[bool] = None) -> int:
        """Count users in database"""
        try:
            if is_real is None:
                result = self.client.count(collection_name=self.collection_name)
                return result.count
            else:
                result = self.client.count(
                    collection_name=self.collection_name,
                    count_filter=Filter(
                        must=[
                            FieldCondition(
                                key="is_real",
                                match=MatchValue(value=is_real)
                            )
                        ]
                    )
                )
                return result.count
        except Exception as e:
            print(f"Error counting users: {str(e)}")
            return 0

    def delete_all_ghost_users(self):
        """Delete all ghost users (is_real=False)"""
        try:
            # Qdrant doesn't support delete by filter directly in all versions
            # We'll scroll through ghost users and delete them
            scroll_result = self.client.scroll(
                collection_name=self.collection_name,
                scroll_filter=Filter(
                    must=[
                        FieldCondition(
                            key="is_real",
                            match=MatchValue(value=False)
                        )
                    ]
                ),
                limit=10000,
                with_payload=False
            )

            ghost_ids = [str(point.id) for point in scroll_result[0]]

            if ghost_ids:
                self.client.delete(
                    collection_name=self.collection_name,
                    points_selector=ghost_ids
                )

            return len(ghost_ids)

        except Exception as e:
            print(f"Error deleting ghost users: {str(e)}")
            return 0

    def clean_duplicate_users(self):
        """Remove duplicate users keeping only the most recent one (case-insensitive)"""
        try:
            # Get all users
            scroll_result = self.client.scroll(
                collection_name=self.collection_name,
                limit=10000,
                with_payload=True
            )

            # Group by normalized username (case-insensitive)
            from collections import defaultdict
            users_by_username = defaultdict(list)

            for point in scroll_result[0]:
                username = point.payload.get("username")
                if username:
                    # Normalize username for comparison
                    normalized_username = username.lower().strip()
                    users_by_username[normalized_username].append({
                        "id": str(point.id),
                        "original_username": username,
                        "created_at": point.payload.get("created_at"),
                        "updated_at": point.payload.get("updated_at")
                    })

            # Find duplicates and keep most recent
            ids_to_delete = []
            for normalized_username, user_list in users_by_username.items():
                if len(user_list) > 1:
                    # Sort by updated_at or created_at (most recent first)
                    sorted_users = sorted(
                        user_list,
                        key=lambda x: x.get("updated_at") or x.get("created_at") or "",
                        reverse=True
                    )
                    # Keep the first (most recent), delete the rest
                    for user in sorted_users[1:]:
                        ids_to_delete.append(user["id"])

                    original_names = [u["original_username"] for u in user_list]
                    print(f"Found {len(sorted_users)} duplicates for user '{normalized_username}' (variants: {original_names}), keeping most recent")

            # Delete duplicates
            if ids_to_delete:
                self.client.delete(
                    collection_name=self.collection_name,
                    points_selector=ids_to_delete
                )
                print(f"Deleted {len(ids_to_delete)} duplicate user entries")

            return len(ids_to_delete)

        except Exception as e:
            print(f"Error cleaning duplicate users: {str(e)}")
            return 0


# Singleton instance
qdrant_service = QdrantService()
