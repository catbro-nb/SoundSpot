"""SoundSpot 模型定义"""
import uuid
from datetime import datetime

from sqlalchemy import String, Boolean, Text, Integer, Float, ForeignKey, DateTime, DECIMAL
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def _uuid():
    return str(uuid.uuid4())


# ─── 用户 ───────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    phone: Mapped[str | None] = mapped_column(String(20), unique=True, nullable=True)
    nickname: Mapped[str] = mapped_column(String(50), nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 关系
    recognize_records = relationship("RecognizeRecord", back_populates="user", lazy="selectin")
    collections = relationship("Collection", back_populates="user", lazy="selectin")
    playlists = relationship("Playlist", back_populates="user", lazy="selectin")


# ─── 艺人 ───────────────────────────────────────────────
class Artist(Base):
    __tablename__ = "artists"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    genre: Mapped[str | None] = mapped_column(String(50), nullable=True)
    country: Mapped[str | None] = mapped_column(String(50), nullable=True)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    songs = relationship("Song", back_populates="artist", lazy="selectin")
    albums = relationship("Album", back_populates="artist", lazy="selectin")


# ─── 专辑 ───────────────────────────────────────────────
class Album(Base):
    __tablename__ = "albums"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    artist_id: Mapped[str] = mapped_column(String(36), ForeignKey("artists.id"), nullable=True)
    cover_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    release_date: Mapped[str | None] = mapped_column(String(10), nullable=True)
    type: Mapped[str] = mapped_column(String(20), default="album")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    artist = relationship("Artist", back_populates="albums")
    songs = relationship("Song", back_populates="album", lazy="selectin")


# ─── 歌曲 ───────────────────────────────────────────────
class Song(Base):
    __tablename__ = "songs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    artist_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("artists.id"), nullable=True)
    album_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("albums.id"), nullable=True)
    duration: Mapped[int | None] = mapped_column(Integer, nullable=True)
    genre: Mapped[str | None] = mapped_column(String(50), nullable=True)
    language: Mapped[str | None] = mapped_column(String(20), nullable=True)
    release_date: Mapped[str | None] = mapped_column(String(10), nullable=True)
    isrc: Mapped[str | None] = mapped_column(String(15), unique=True, nullable=True)
    fingerprint_hash: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    cover_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    audio_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    artist = relationship("Artist", back_populates="songs")
    album = relationship("Album", back_populates="songs")


# ─── 识别记录 ───────────────────────────────────────────
class RecognizeRecord(Base):
    __tablename__ = "recognize_records"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    song_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("songs.id"), nullable=True)
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    match_type: Mapped[str | None] = mapped_column(String(20), nullable=True)
    offset_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    audio_duration: Mapped[float | None] = mapped_column(Float, nullable=True)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="recognize_records")
    song = relationship("Song", lazy="selectin")


# ─── 歌单 ───────────────────────────────────────────────
class Playlist(Base):
    __tablename__ = "playlists"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    cover_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_public: Mapped[bool] = mapped_column(Boolean, default=True)
    type: Mapped[str] = mapped_column(String(20), default="custom")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="playlists")
    playlist_songs = relationship("PlaylistSong", back_populates="playlist", lazy="selectin")


# ─── 歌单-歌曲关联 ─────────────────────────────────────
class PlaylistSong(Base):
    __tablename__ = "playlist_songs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    playlist_id: Mapped[str] = mapped_column(String(36), ForeignKey("playlists.id"), nullable=False)
    song_id: Mapped[str] = mapped_column(String(36), ForeignKey("songs.id"), nullable=False)
    position: Mapped[int | None] = mapped_column(Integer, nullable=True)
    added_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    playlist = relationship("Playlist", back_populates="playlist_songs")
    song = relationship("Song", lazy="selectin")


# ─── 收藏 ───────────────────────────────────────────────
class Collection(Base):
    __tablename__ = "collections"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    target_type: Mapped[str] = mapped_column(String(20), nullable=False)  # song/artist/album
    target_id: Mapped[str] = mapped_column(String(36), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="collections")
