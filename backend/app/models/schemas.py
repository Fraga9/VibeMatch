from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime


# Auth Models
class LastFMAuthRequest(BaseModel):
    token: str


class LastFMAuthResponse(BaseModel):
    access_token: str
    username: str
    session_key: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# User Models
class Artist(BaseModel):
    name: str
    playcount: int
    mbid: Optional[str] = None


class Track(BaseModel):
    name: str
    artist: str
    playcount: int
    mbid: Optional[str] = None
    image: Optional[str] = None


class RecentTrack(BaseModel):
    name: str
    artist: str
    album: Optional[str] = None
    image: Optional[str] = None
    timestamp: Optional[int] = None
    nowplaying: bool = False


class UserProfile(BaseModel):
    username: str
    real_name: Optional[str] = None
    country: Optional[str] = None
    age: Optional[int] = None
    playcount: int
    registered: Optional[int] = None
    url: str
    image: Optional[str] = None
    top_artists: List[Artist] = []
    top_tracks: List[Track] = []
    recent_tracks: List[RecentTrack] = []


# Embedding Models
class UserEmbeddingRequest(BaseModel):
    username: str


class UserEmbeddingResponse(BaseModel):
    user_id: str
    username: str
    embedding_dim: int
    top_artists: List[str]
    created_at: datetime


# Match Models
class MatchResult(BaseModel):
    user_id: Optional[str] = None
    username: Optional[str] = None
    similarity: float
    is_real: bool
    shared_artists: List[str]
    shared_tracks: List[Dict[str, str]]
    top_genres: List[str] = []
    profile_image: Optional[str] = None
    country: Optional[str] = None
    compatibility_score: int = Field(..., ge=0, le=100)


class TopMatchesResponse(BaseModel):
    matches: List[MatchResult]
    total_count: int


# Admin Models
class SeedGhostUsersRequest(BaseModel):
    count: int = 10000
    force_reseed: bool = False


class SeedGhostUsersResponse(BaseModel):
    status: str
    users_created: int
    message: str


# Error Models
class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
