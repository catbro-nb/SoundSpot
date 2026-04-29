"""种子数据 - 填充模拟歌曲库"""
from app.database import SessionLocal
from app.models import Artist, Album, Song


def seed_data():
    db = SessionLocal()
    try:
        if db.query(Song).count() > 0:
            return

        # ─── 艺人 ──────────────────────
        artists_data = [
            ("周杰伦", "流行", "CN", "https://picsum.photos/seed/artist1/200/200"),
            ("Taylor Swift", "流行", "US", "https://picsum.photos/seed/artist2/200/200"),
            ("林俊杰", "流行", "SG", "https://picsum.photos/seed/artist3/200/200"),
            ("Ed Sheeran", "流行", "UK", "https://picsum.photos/seed/artist4/200/200"),
            ("薛之谦", "流行", "CN", "https://picsum.photos/seed/artist5/200/200"),
            ("Adele", "流行", "UK", "https://picsum.photos/seed/artist6/200/200"),
            ("陈奕迅", "流行", "HK", "https://picsum.photos/seed/artist7/200/200"),
            ("Bruno Mars", "R&B", "US", "https://picsum.photos/seed/artist8/200/200"),
            ("邓紫棋", "流行", "HK", "https://picsum.photos/seed/artist9/200/200"),
            ("The Weeknd", "R&B", "CA", "https://picsum.photos/seed/artist10/200/200"),
        ]
        artists = []
        for name, genre, country, avatar in artists_data:
            a = Artist(name=name, genre=genre, country=country, avatar_url=avatar)
            db.add(a)
            artists.append(a)
        db.commit()
        # 刷新获取 ID
        for a in artists:
            db.refresh(a)

        # ─── 专辑 ──────────────────────
        albums_data = [
            (0, "叶惠美", "2003-07-31", "https://picsum.photos/seed/album1/300/300"),
            (1, "1989", "2014-10-27", "https://picsum.photos/seed/album2/300/300"),
            (2, "因你而在", "2013-03-13", "https://picsum.photos/seed/album3/300/300"),
            (3, "÷ (Divide)", "2017-03-03", "https://picsum.photos/seed/album4/300/300"),
            (4, "绅士", "2016-06-21", "https://picsum.photos/seed/album5/300/300"),
            (5, "25", "2015-11-20", "https://picsum.photos/seed/album6/300/300"),
            (6, "U87", "2005-06-07", "https://picsum.photos/seed/album7/300/300"),
            (7, "24K Magic", "2016-11-18", "https://picsum.photos/seed/album8/300/300"),
            (8, "新的心跳", "2015-11-06", "https://picsum.photos/seed/album9/300/300"),
            (9, "After Hours", "2020-03-20", "https://picsum.photos/seed/album10/300/300"),
            (0, "七里香", "2004-08-03", "https://picsum.photos/seed/album11/300/300"),
            (1, "Lover", "2019-08-23", "https://picsum.photos/seed/album12/300/300"),
            (6, "认了吧", "2007-04-24", "https://picsum.photos/seed/album13/300/300"),
            (2, "学不会", "2011-12-30", "https://picsum.photos/seed/album14/300/300"),
            (8, "摩天动物园", "2018-12-27", "https://picsum.photos/seed/album15/300/300"),
        ]
        albums = []
        for artist_idx, title, release, cover in albums_data:
            al = Album(title=title, artist_id=artists[artist_idx].id, release_date=release, cover_url=cover)
            db.add(al)
            albums.append(al)
        db.commit()
        for al in albums:
            db.refresh(al)

        # ─── 歌曲 ──────────────────────
        songs_data = [
            (0, 0, "晴天", 269, "流行", "CN", "2003-07-31"),
            (0, 0, "以父之名", 342, "流行", "CN", "2003-07-31"),
            (0, 10, "七里香", 299, "流行", "CN", "2004-08-03"),
            (0, 10, "借口", 283, "流行", "CN", "2004-08-03"),
            (1, 1, "Shake It Off", 219, "流行", "EN", "2014-10-27"),
            (1, 1, "Blank Space", 231, "流行", "EN", "2014-10-27"),
            (1, 11, "Lover", 221, "流行", "EN", "2019-08-23"),
            (1, 11, "Cruel Summer", 178, "流行", "EN", "2019-08-23"),
            (2, 2, "修炼爱情", 295, "流行", "CN", "2013-03-13"),
            (2, 2, "因你而在", 262, "流行", "CN", "2013-03-13"),
            (2, 13, "学不会", 268, "流行", "CN", "2011-12-30"),
            (3, 3, "Shape of You", 234, "流行", "EN", "2017-03-03"),
            (3, 3, "Perfect", 263, "流行", "EN", "2017-03-03"),
            (4, 4, "演员", 252, "流行", "CN", "2016-06-21"),
            (4, 4, "绅士", 234, "流行", "CN", "2016-06-21"),
            (5, 5, "Hello", 295, "流行", "EN", "2015-11-20"),
            (5, 5, "Someone Like You", 285, "流行", "EN", "2015-11-20"),
            (6, 6, "浮夸", 262, "流行", "CN", "2005-06-07"),
            (6, 12, "富士山下", 258, "流行", "CN", "2007-04-24"),
            (6, 12, "爱情转移", 246, "流行", "CN", "2007-04-24"),
            (7, 7, "24K Magic", 225, "R&B", "EN", "2016-11-18"),
            (7, 7, "That's What I Like", 234, "R&B", "EN", "2016-11-18"),
            (8, 8, "光年之外", 235, "流行", "CN", "2015-11-06"),
            (8, 14, "倒数", 248, "流行", "CN", "2018-12-27"),
            (9, 9, "Blinding Lights", 200, "R&B", "EN", "2020-03-20"),
            (9, 9, "Save Your Tears", 215, "R&B", "EN", "2020-03-20"),
            (0, 0, "东风破", 282, "流行", "CN", "2003-07-31"),
            (2, 2, "江南", 268, "流行", "CN", "2013-03-13"),
            (6, 6, "K歌之王", 272, "流行", "CN", "2005-06-07"),
            (5, 5, "Rolling in the Deep", 228, "流行", "EN", "2015-11-20"),
        ]

        for artist_idx, album_idx, title, duration, genre, lang, release in songs_data:
            s = Song(
                title=title,
                artist_id=artists[artist_idx].id,
                album_id=albums[album_idx].id,
                duration=duration,
                genre=genre,
                language=lang,
                release_date=release,
                cover_url=albums[album_idx].cover_url,
                audio_url=f"https://example.com/audio/{title.replace(' ', '_').lower()}.mp3",
            )
            db.add(s)
        db.commit()
        print(f"✅ 种子数据: {len(artists)} 位艺人, {len(albums)} 张专辑, {len(songs_data)} 首歌曲")
    except Exception as e:
        db.rollback()
        print(f"❌ 种子数据失败: {e}")
    finally:
        db.close()
