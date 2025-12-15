from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Last.fm API
    LASTFM_API_KEY: str
    LASTFM_API_SECRET: str
    LASTFM_CALLBACK_URL: str

    # Spotify API (Optional)
    SPOTIFY_CLIENT_ID: Optional[str] = None
    SPOTIFY_CLIENT_SECRET: Optional[str] = None
    SPOTIFY_CALLBACK_URL: Optional[str] = None

    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 43200

    # Qdrant
    QDRANT_HOST: str = "localhost"
    QDRANT_PORT: int = 6333
    QDRANT_API_KEY: Optional[str] = None
    QDRANT_USE_HTTPS: bool = False
    QDRANT_COLLECTION_USERS: str = "users"
    QDRANT_VECTOR_SIZE: int = 128

    # Redis
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0

    # Admin
    ADMIN_API_KEY: str

    # Environment
    ENVIRONMENT: str = "development"
    FRONTEND_URL: str = "http://localhost:3000"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
