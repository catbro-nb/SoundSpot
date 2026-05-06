import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, Play, Pause, Share2 } from 'lucide-react';
import { getSong } from '../api/songs';
import { getSimilar } from '../api/recommend';
import type { Song, RecommendItem } from '../api/types';
import { usePlayerStore } from '../stores/playerStore';

export default function SongDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [song, setSong] = useState<Song | null>(null);
  const [similar, setSimilar] = useState<RecommendItem[]>([]);
  const { currentSong, isPlaying, toggle, setQueue } = usePlayerStore();

  useEffect(() => {
    if (id) {
      getSong(id).then(r => setSong(r)).catch(() => {});
      getSimilar(id).then(r => setSimilar(r.items)).catch(() => {});
    }
  }, [id]);

  if (!song) return <div className="flex items-center justify-center h-64 text-slate-500">加载中...</div>;

  const formatDuration = (s: number | null) => s ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : '--:--';
  const isCurrent = currentSong?.id === song.id;
  const isActive = isCurrent && isPlaying;

  const similarSongs = similar.map(s => s.song);
  const handlePlaySimilar = (s: Song) => {
    const idx = similarSongs.findIndex(ss => ss.id === s.id);
    setQueue(similarSongs, idx >= 0 ? idx : 0);
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      {/* 歌曲信息 */}
      <div className="flex gap-6 mb-10">
        <img src={song.cover_url || `https://picsum.photos/seed/detail${id}/200/200`} alt="" className="w-48 h-48 rounded-2xl object-cover shadow-2xl" />
        <div className="flex flex-col justify-end">
          <p className="text-xs text-slate-500 uppercase mb-1">{song.genre || '音乐'}</p>
          <h1 className="text-3xl font-bold mb-2">{song.title}</h1>
          <p className="text-slate-400 mb-1">{song.artist?.name || '未知艺人'}</p>
          <p className="text-sm text-slate-500 mb-4">{song.album?.title || ''} · {song.release_date || ''} · {formatDuration(song.duration)}</p>
          <div className="flex gap-3">
            <button
              onClick={() => toggle(song)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium transition-colors"
            >
              {isActive ? <Pause size={16} /> : <Play size={16} />} {isActive ? '暂停' : '播放'}
            </button>
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm transition-colors hover:bg-white/5" style={{ borderColor: '#2d2d4a' }}>
              <Heart size={16} /> 收藏
            </button>
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm transition-colors hover:bg-white/5" style={{ borderColor: '#2d2d4a' }}>
              <Share2 size={16} /> 分享
            </button>
          </div>
        </div>
      </div>

      {/* 相似推荐 */}
      <section>
        <h2 className="text-xl font-bold mb-4">相似推荐</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {similar.map((item, i) => {
            const isSimCurrent = currentSong?.id === item.song.id;
            const isSimActive = isSimCurrent && isPlaying;
            return (
              <div
                key={i}
                className="group cursor-pointer rounded-xl p-3 transition-all duration-300 hover:scale-105"
                style={{ background: '#1a1a2e' }}
                onClick={() => navigate(`/song/${item.song.id}`)}
              >
                <div className="aspect-square rounded-lg mb-3 overflow-hidden relative">
                  <img src={item.song.cover_url || `https://picsum.photos/seed/sim${i}/300/300`} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                  <div
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    onClick={(e) => { e.stopPropagation(); handlePlaySimilar(item.song); }}
                  >
                    <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center">
                      {isSimActive ? <Pause size={18} className="text-white" /> : <Play size={18} className="text-white ml-0.5" />}
                    </div>
                  </div>
                </div>
                <p className={`text-sm font-medium truncate ${isSimCurrent ? 'text-indigo-400' : ''}`}>{item.song.title}</p>
                <p className="text-xs text-slate-500 truncate">{item.song.artist?.name || '未知'}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
