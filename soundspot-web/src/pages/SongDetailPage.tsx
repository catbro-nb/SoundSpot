import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Heart, Play, Share2 } from 'lucide-react';
import { getSong } from '../api/songs';
import { getSimilar } from '../api/recommend';
import type { Song, RecommendItem } from '../api/types';

export default function SongDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [song, setSong] = useState<Song | null>(null);
  const [similar, setSimilar] = useState<RecommendItem[]>([]);

  useEffect(() => {
    if (id) {
      getSong(id).then(r => setSong(r)).catch(() => {});
      getSimilar(id).then(r => setSimilar(r.items)).catch(() => {});
    }
  }, [id]);

  if (!song) return <div className="flex items-center justify-center h-64 text-slate-500">加载中...</div>;

  const formatDuration = (s: number | null) => s ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : '--:--';

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
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium transition-colors">
              <Play size={16} /> 播放
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
          {similar.map((item, i) => (
            <div key={i} className="group cursor-pointer rounded-xl p-3 transition-all duration-300 hover:scale-105" style={{ background: '#1a1a2e' }}>
              <div className="aspect-square rounded-lg mb-3 overflow-hidden">
                <img src={item.song.cover_url || `https://picsum.photos/seed/sim${i}/300/300`} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
              </div>
              <p className="text-sm font-medium truncate">{item.song.title}</p>
              <p className="text-xs text-slate-500 truncate">{item.song.artist?.name || '未知'}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
