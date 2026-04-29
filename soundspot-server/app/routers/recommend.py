"""推荐路由"""
import random
from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import User, Song
from app.schemas import RecommendItem, RecommendResponse, SongResponse, ArtistBrief, AlbumBrief

router = APIRouter(prefix="/api/v1/recommend", tags=["推荐"])


def _song_to_response(song: Song) -> SongResponse:
    return SongResponse(
        id=song.id,
        title=song.title,
        artist=ArtistBrief(id=song.artist.id, name=song.artist.name, avatar_url=song.artist.avatar_url) if song.artist else None,
        album=AlbumBrief(id=song.album.id, title=song.album.title, cover_url=song.album.cover_url) if song.album else None,
        duration=song.duration,
        genre=song.genre,
        cover_url=song.cover_url,
        audio_url=song.audio_url,
        release_date=song.release_date,
    )


@router.get("/daily", response_model=RecommendResponse)
def daily_recommend(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """每日推荐（MVP：随机推荐 + 推荐理由模拟）"""
    all_songs = db.query(Song).all()
    if not all_songs:
        return RecommendResponse(total=0, items=[], refreshed_at=datetime.utcnow())

    random.shuffle(all_songs)
    selected = all_songs[:page_size]

    reasons_pool = [
        ("基于你的听歌口味推荐", "item_cf"),
        ("热门歌曲推荐", "hot"),
        ("新歌速递", "new"),
        ("与你的收藏风格相似", "content"),
        ("大家都在听", "trending"),
    ]

    items = []
    for song in selected:
        reason, rtype = random.choice(reasons_pool)
        items.append(RecommendItem(
            song=_song_to_response(song),
            reason=reason,
            reason_type=rtype,
            confidence=round(random.uniform(0.6, 0.95), 2),
        ))

    return RecommendResponse(
        total=len(all_songs),
        items=items,
        refreshed_at=datetime.utcnow(),
    )


@router.get("/similar/{song_id}", response_model=RecommendResponse)
def similar_recommend(
    song_id: str,
    page_size: int = Query(default=10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """相似歌曲推荐（MVP：同流派随机）"""
    song = db.query(Song).filter(Song.id == song_id).first()
    if not song:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="歌曲不存在")

    similar = db.query(Song).filter(Song.genre == song.genre, Song.id != song.id).all()
    if not similar:
        similar = db.query(Song).filter(Song.id != song.id).all()

    random.shuffle(similar)
    selected = similar[:page_size]

    items = [
        RecommendItem(
            song=_song_to_response(s),
            reason=f"与《{song.title}》风格相似",
            reason_type="content",
            confidence=round(random.uniform(0.7, 0.95), 2),
        )
        for s in selected
    ]

    return RecommendResponse(total=len(similar), items=items, refreshed_at=datetime.utcnow())
