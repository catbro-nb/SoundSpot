"""种子数据 - 基于真实音乐文件的9首周杰伦歌曲"""
from app.database import SessionLocal
from app.models import Artist, Album, Song


def seed_data():
    db = SessionLocal()
    try:
        if db.query(Song).count() > 0:
            return

        # ─── 艺人 ──────────────────────
        artist = Artist(
            name="周杰伦",
            genre="流行",
            country="CN",
            avatar_url="https://picsum.photos/seed/jaychou/200/200",
        )
        db.add(artist)
        db.commit()
        db.refresh(artist)

        # ─── 专辑 ──────────────────────
        albums_data = [
            ("叶惠美", "2003-07-31", "https://picsum.photos/seed/yehuimei/300/300"),
            ("Jay", "2000-11-07", "https://picsum.photos/seed/jay/300/300"),
            ("七里香", "2004-08-03", "https://picsum.photos/seed/qilixiang/300/300"),
            ("J III MP3 Player", "2005-06-23", "https://picsum.photos/seed/j3/300/300"),
            ("我很忙", "2007-11-02", "https://picsum.photos/seed/wohenmang/300/300"),
            ("范特西", "2001-09-14", "https://picsum.photos/seed/fantesy/300/300"),
            ("魔杰座", "2008-10-15", "https://picsum.photos/seed/mojiezuo/300/300"),
        ]
        albums = []
        for title, release, cover in albums_data:
            al = Album(title=title, artist_id=artist.id, release_date=release, cover_url=cover)
            db.add(al)
            albums.append(al)
        db.commit()
        for al in albums:
            db.refresh(al)

        # ─── 歌曲（与 music/ 目录中的真实 MP3 一一对应）────────
        # (title, album_idx, duration, audio_filename)
        songs_data = [
            ("晴天",       0, 269, "晴天.mp3"),         # 叶惠美
            ("反方向的钟", 1, 258, "反方向的钟.mp3"),    # Jay
            ("搁浅",       2, 240, "搁浅.mp3"),         # 七里香
            ("一路向北",   3, 294, "一路向北.mp3"),      # J III MP3 Player
            ("青花瓷",     4, 239, "青花瓷.mp3"),        # 我很忙
            ("爱在西元前", 5, 234, "爱在西元前.mp3"),    # 范特西
            ("稻香",       6, 223, "稻香.mp3"),         # 魔杰座
            ("花海",       6, 264, "花海.mp3"),         # 魔杰座
            ("蒲公英的约定", 4, 247, "蒲公英的约定.mp3"), # 我很忙
        ]

        for title, album_idx, duration, audio_file in songs_data:
            s = Song(
                title=title,
                artist_id=artist.id,
                album_id=albums[album_idx].id,
                duration=duration,
                genre="流行",
                language="CN",
                release_date=albums[album_idx].release_date,
                cover_url=albums[album_idx].cover_url,
                audio_url=f"/static/audio/{audio_file}",
            )
            db.add(s)
        db.commit()
        print(f"[OK] Seed: 1 artist, {len(albums)} albums, {len(songs_data)} songs")
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Seed failed: {e}")
    finally:
        db.close()
