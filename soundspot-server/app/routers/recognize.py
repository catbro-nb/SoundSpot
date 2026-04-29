"""识别路由"""
import uuid
import random
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import User, Song, RecognizeRecord
from app.schemas import RecognizeResponse, RecognizeResult, RecognizeRecordResponse, SongResponse, ArtistBrief, AlbumBrief

router = APIRouter(prefix="/api/v1/recognize", tags=["识别"])


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


@router.post("/upload", response_model=RecognizeResponse)
async def recognize_upload(
    audio: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """上传音频文件进行识别（MVP 版本：模拟识别）"""
    task_id = f"rec_{uuid.uuid4().hex[:12]}"

    # MVP 阶段：随机从数据库匹配一首歌模拟识别
    all_songs = db.query(Song).all()
    if all_songs and random.random() > 0.15:
        matched = random.choice(all_songs)
        confidence = round(random.uniform(0.82, 0.99), 4)

        record = RecognizeRecord(
            user_id=current_user.id,
            song_id=matched.id,
            confidence=confidence,
            match_type="fingerprint",
            offset_ms=random.randint(0, (matched.duration or 180) * 1000),
            audio_duration=random.uniform(3.0, 10.0),
        )
        db.add(record)
        db.commit()
        db.refresh(record)

        return RecognizeResponse(
            task_id=task_id,
            status="completed",
            result=RecognizeResult(
                song=_song_to_response(matched),
                confidence=confidence,
                match_type="fingerprint",
                offset_ms=record.offset_ms,
            ),
        )
    else:
        record = RecognizeRecord(
            user_id=current_user.id,
            song_id=None,
            confidence=None,
            match_type=None,
            audio_duration=random.uniform(3.0, 10.0),
        )
        db.add(record)
        db.commit()

        return RecognizeResponse(
            task_id=task_id,
            status="completed",
            result=None,
            message="未找到匹配歌曲，建议在安静环境中重新录制",
        )


@router.get("/history", response_model=list[RecognizeRecordResponse])
def get_recognize_history(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    records = (
        db.query(RecognizeRecord)
        .filter(RecognizeRecord.user_id == current_user.id)
        .order_by(RecognizeRecord.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    result = []
    for r in records:
        result.append(RecognizeRecordResponse(
            id=r.id,
            song=_song_to_response(r.song) if r.song else None,
            confidence=r.confidence,
            match_type=r.match_type,
            audio_duration=r.audio_duration,
            note=r.note,
            created_at=r.created_at,
        ))
    return result


@router.delete("/history/{record_id}")
def delete_recognize_record(
    record_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = db.query(RecognizeRecord).filter(
        RecognizeRecord.id == record_id,
        RecognizeRecord.user_id == current_user.id,
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="识别记录不存在")
    db.delete(record)
    db.commit()
    return {"message": "删除成功"}
