"""识别路由 - 基于音频指纹的听音识曲"""
import os
import uuid
import tempfile

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import User, Song, RecognizeRecord
from app.schemas import RecognizeResponse, RecognizeResult, RecognizeRecordResponse, SongResponse, ArtistBrief, AlbumBrief
from app.fingerprint import match_audio

router = APIRouter(prefix="/api/v1/recognize", tags=["识别"])

AUDIO_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static", "audio")


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


def _convert_to_wav(input_path: str) -> str:
    """将任意音频格式转为 wav，供 librosa 分析"""
    import librosa
    import soundfile as sf

    # librosa 能自动处理 mp3/wav/ogg/webm/flac 等
    y, sr = librosa.load(input_path, sr=22050, mono=True)
    wav_path = input_path + ".wav"
    sf.write(wav_path, y, sr)
    return wav_path


@router.post("/upload", response_model=RecognizeResponse)
async def recognize_upload(
    audio: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """上传录音进行识别（基于音频指纹匹配）"""
    task_id = f"rec_{uuid.uuid4().hex[:12]}"

    # 保存上传的音频到临时文件
    suffix = os.path.splitext(audio.filename or ".webm")[1]
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        content = await audio.read()
        tmp.write(content)
        tmp_path = tmp.name

    wav_path = None
    try:
        # 调试：打印上传文件信息
        print(f"[RECOGNIZE] Upload: {audio.filename}, size={len(content)} bytes, content_type={audio.content_type}")

        # 统一转为 wav 格式分析
        try:
            wav_path = _convert_to_wav(tmp_path)
        except Exception as e:
            print(f"[RECOGNIZE] WAV convert failed: {e}, using raw file")
            # 如果转换失败，直接尝试原始文件
            wav_path = tmp_path

        # 调试：检查 wav 文件
        if wav_path and os.path.exists(wav_path):
            print(f"[RECOGNIZE] WAV file: {os.path.getsize(wav_path)} bytes")

        # 使用指纹匹配
        match_result = match_audio(wav_path)

        if match_result:
            # 根据文件名找到对应的歌曲
            filename = match_result["filename"]
            song = db.query(Song).filter(Song.audio_url == f"/static/audio/{filename}").first()

            if song:
                confidence = match_result["confidence"]
                # 估算录音时长
                audio_duration = len(content) / 16000
                try:
                    import librosa
                    dur = librosa.get_duration(path=wav_path)
                    if dur > 0:
                        audio_duration = dur
                except Exception:
                    pass

                record = RecognizeRecord(
                    user_id=current_user.id,
                    song_id=song.id,
                    confidence=confidence,
                    match_type="fingerprint",
                    offset_ms=0,
                    audio_duration=audio_duration,
                )
                db.add(record)
                db.commit()
                db.refresh(record)

                return RecognizeResponse(
                    task_id=task_id,
                    status="completed",
                    result=RecognizeResult(
                        song=_song_to_response(song),
                        confidence=confidence,
                        match_type="fingerprint",
                        offset_ms=0,
                    ),
                )

        # 未匹配成功
        record = RecognizeRecord(
            user_id=current_user.id,
            song_id=None,
            confidence=None,
            match_type=None,
            audio_duration=len(content) / 16000,
        )
        db.add(record)
        db.commit()

        return RecognizeResponse(
            task_id=task_id,
            status="completed",
            result=None,
            message="无法识别该音乐，请确保音乐在库中且录音时长足够（建议5秒以上）",
        )
    finally:
        # 清理临时文件
        for p in [tmp_path, wav_path]:
            if p and os.path.exists(p):
                try:
                    os.unlink(p)
                except Exception:
                    pass


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
