from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, user, match, admin
from app.core.config import settings

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
    allow_origins=["*"] if settings.ENVIRONMENT == "development" else ["https://vibematch.app"],
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
