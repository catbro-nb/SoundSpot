"""SoundSpot Pydantic Schemas"""
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


# ─── 认证 ───────────────────────────────────────────────
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    nickname: str = Field(min_length=1, max_length=50)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


# ─── 用户 ───────────────────────────────────────────────
class UserResponse(BaseModel):
    id: str
    email: str
    nickname: str
    avatar_url: str | None = None
    status: str = "active"
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdateRequest(BaseModel):
    nickname: str | None = None
    avatar_url: str | None = None


# ─── 歌曲 ───────────────────────────────────────────────
class ArtistBrief(BaseModel):
    id: str
    name: str
    avatar_url: str | None = None

    class Config:
        from_attributes = True


class AlbumBrief(BaseModel):
    id: str
    title: str
    cover_url: str | None = None

    class Config:
        from_attributes = True


class SongResponse(BaseModel):
    id: str
    title: str
    artist: ArtistBrief | None = None
    album: AlbumBrief | None = None
    duration: int | None = None
    genre: str | None = None
    cover_url: str | None = None
    audio_url: str | None = None
    release_date: str | None = None

    class Config:
        from_attributes = True


# ─── 识别 ───────────────────────────────────────────────
class RecognizeResult(BaseModel):
    song: SongResponse | None = None
    confidence: float | None = None
    match_type: str | None = None
    offset_ms: int | None = None


class RecognizeResponse(BaseModel):
    task_id: str
    status: str  # processing / completed / failed
    result: RecognizeResult | None = None
    message: str | None = None


class RecognizeRecordResponse(BaseModel):
    id: str
    song: SongResponse | None = None
    confidence: float | None = None
    match_type: str | None = None
    audio_duration: float | None = None
    note: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


# ─── 推荐 ───────────────────────────────────────────────
class RecommendItem(BaseModel):
    song: SongResponse
    reason: str | None = None
    reason_type: str | None = None
    confidence: float | None = None


class RecommendResponse(BaseModel):
    total: int
    items: list[RecommendItem]
    refreshed_at: datetime | None = None


# ─── 歌单 ───────────────────────────────────────────────
class PlaylistResponse(BaseModel):
    id: str
    name: str
    description: str | None = None
    cover_url: str | None = None
    is_public: bool = True
    song_count: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PlaylistCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str | None = None
    is_public: bool = True


class PlaylistAddSongRequest(BaseModel):
    song_id: str


# ─── 收藏 ───────────────────────────────────────────────
class CollectionRequest(BaseModel):
    target_type: str  # song / artist / album
    target_id: str


# ─── 通用 ───────────────────────────────────────────────
class PaginatedResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: list


class ErrorResponse(BaseModel):
    code: str
    message: str
    detail: dict | None = None
