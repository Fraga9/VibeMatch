from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, user, match, admin
from app.core.config import settings
import logging
from pathlib import Path
import sys

# Configure logging with UTF-8 encoding
log_dir = Path("logs")
log_dir.mkdir(exist_ok=True)

# Create handlers with UTF-8 encoding
file_handler = logging.FileHandler(
    log_dir / 'vibematch.log',
    encoding='utf-8'
)

# Console handler with UTF-8 encoding (safe for Windows)
try:
    # Try to use UTF-8 mode for console on Windows
    console_handler = logging.StreamHandler(
        stream=open(sys.stdout.fileno(), mode='w', encoding='utf-8', buffering=1, closefd=False)
    )
except:
    # Fallback: use regular StreamHandler and ignore encoding errors
    console_handler = logging.StreamHandler()

# Set formatter
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
file_handler.setFormatter(formatter)
console_handler.setFormatter(formatter)

# Configure root logger
logging.basicConfig(
    level=logging.INFO,
    handlers=[console_handler, file_handler]
)

# Reduce noise from dependencies
logging.getLogger('httpx').setLevel(logging.WARNING)
logging.getLogger('qdrant_client').setLevel(logging.WARNING)

# Create FastAPI app
app = FastAPI(
    title="VibeMatch API",
    description="Music taste matching API powered by GNN embeddings and Last.fm",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.ENVIRONMENT == "development" else [
        settings.FRONTEND_URL,
        "http://localhost:3000",  # For local development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(user.router)
app.include_router(match.router)
app.include_router(admin.router)


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "message": "VibeMatch API is running",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Detailed health check"""
    from app.services.qdrant_service import qdrant_service

    try:
        # Check Qdrant connection
        user_count = qdrant_service.count_users()

        return {
            "status": "healthy",
            "services": {
                "api": "up",
                "qdrant": "up",
                "embeddings": "loaded"
            },
            "stats": {
                "total_users": user_count
            }
        }
    except Exception as e:
        return {
            "status": "degraded",
            "error": str(e)
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
