"""歌单路由"""
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import User, Playlist, PlaylistSong, Song
from app.schemas import PlaylistResponse, PlaylistCreateRequest, PlaylistAddSongRequest

router = APIRouter(prefix="/api/v1/playlists", tags=["歌单"])


@router.get("/", response_model=list[PlaylistResponse])
def get_playlists(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    playlists = db.query(Playlist).filter(Playlist.user_id == current_user.id).all()
    result = []
    for p in playlists:
        song_count = db.query(PlaylistSong).filter(PlaylistSong.playlist_id == p.id).count()
        result.append(PlaylistResponse(
            id=p.id, name=p.name, description=p.description,
            cover_url=p.cover_url, is_public=p.is_public,
            song_count=song_count, created_at=p.created_at, updated_at=p.updated_at,
        ))
    return result


@router.post("/", response_model=PlaylistResponse, status_code=201)
def create_playlist(
    req: PlaylistCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    playlist = Playlist(
        user_id=current_user.id,
        name=req.name,
        description=req.description,
        is_public=req.is_public,
    )
    db.add(playlist)
    db.commit()
    db.refresh(playlist)
    return PlaylistResponse(
        id=playlist.id, name=playlist.name, description=playlist.description,
        cover_url=playlist.cover_url, is_public=playlist.is_public,
        song_count=0, created_at=playlist.created_at, updated_at=playlist.updated_at,
    )


@router.post("/{playlist_id}/songs", status_code=201)
def add_song_to_playlist(
    playlist_id: str,
    req: PlaylistAddSongRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    playlist = db.query(Playlist).filter(Playlist.id == playlist_id, Playlist.user_id == current_user.id).first()
    if not playlist:
        raise HTTPException(status_code=404, detail="歌单不存在")

    song = db.query(Song).filter(Song.id == req.song_id).first()
    if not song:
        raise HTTPException(status_code=404, detail="歌曲不存在")

    existing = db.query(PlaylistSong).filter(
        PlaylistSong.playlist_id == playlist_id,
        PlaylistSong.song_id == req.song_id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="歌曲已在歌单中")

    max_pos = db.query(PlaylistSong).filter(PlaylistSong.playlist_id == playlist_id).count()
    ps = PlaylistSong(playlist_id=playlist_id, song_id=req.song_id, position=max_pos)
    db.add(ps)
    db.commit()
    return {"message": "添加成功"}
