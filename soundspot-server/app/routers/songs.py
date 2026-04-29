"""歌曲路由"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.dependencies import get_optional_user
from app.models import Song, Artist, Album, Collection
from app.schemas import SongResponse, ArtistBrief, AlbumBrief

router = APIRouter(prefix="/api/v1/songs", tags=["音乐库"])


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


@router.get("/{song_id}", response_model=SongResponse)
def get_song(song_id: str, db: Session = Depends(get_db)):
    song = db.query(Song).filter(Song.id == song_id).first()
    if not song:
        raise HTTPException(status_code=404, detail="歌曲不存在")
    return _song_to_response(song)


@router.get("/", response_model=list[SongResponse])
def search_songs(
    q: str = Query(default="", max_length=100),
    genre: str = Query(default=""),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(Song)
    if q:
        query = query.join(Artist, Song.artist_id == Artist.id, isouter=True).filter(
            or_(
                Song.title.ilike(f"%{q}%"),
                Artist.name.ilike(f"%{q}%"),
            )
        )
    if genre:
        query = query.filter(Song.genre == genre)

    songs = query.offset((page - 1) * page_size).limit(page_size).all()
    return [_song_to_response(s) for s in songs]
