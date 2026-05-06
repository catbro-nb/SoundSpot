import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Play, Pause } from 'lucide-react';
import { getDaily } from '../api/recommend';
import type { RecommendItem, Song } from '../api/types';
import { usePlayerStore } from '../stores/playerStore';

export default function DiscoverPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<RecommendItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { currentSong, isPlaying, toggle, setQueue } = usePlayerStore();

  const load = async () => {
    setLoading(true);
    try { const r = await getDaily(); setItems(r.items); } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const allSongs = items.map(i => i.song);

  const handlePlaySong = (song: Song) => {
    const idx = allSongs.findIndex(s => s.id === song.id);
    setQueue(allSongs, idx >= 0 ? idx : 0);
  };

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">发现音乐</h1>
        <button onClick={load} disabled={loading} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 transition-colors">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> 刷新
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {items.map((item, i) => {
          const isCurrent = currentSong?.id === item.song.id;
          const isActive = isCurrent && isPlaying;
          return (
            <div
              key={i}
              className="group cursor-pointer rounded-xl p-3 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/10"
              style={{ background: '#1a1a2e' }}
              onClick={() => navigate(`/song/${item.song.id}`)}
            >
              <div className="aspect-square rounded-lg mb-3 overflow-hidden relative">
                <img src={item.song.cover_url || `https://picsum.photos/seed/disc${i}/300/300`} alt={item.song.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                <div
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  onClick={(e) => { e.stopPropagation(); handlePlaySong(item.song); }}
                >
                  <div className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center shadow-lg">
                    {isActive ? <Pause size={22} className="text-white" /> : <Play size={22} className="text-white ml-1" />}
                  </div>
                </div>
                {isCurrent && (
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-indigo-500/90 text-xs text-white flex items-center gap-1">
                    {isActive ? (
                      <span className="flex gap-0.5">
                        <span className="w-1 bg-white rounded-full wave-bar" style={{ animationDelay: '0s' }} />
                        <span className="w-1 bg-white rounded-full wave-bar" style={{ animationDelay: '0.15s' }} />
                        <span className="w-1 bg-white rounded-full wave-bar" style={{ animationDelay: '0.3s' }} />
                      </span>
                    ) : <Pause size={10} />}
                  </div>
                )}
              </div>
              <p className={`text-sm font-medium truncate ${isCurrent ? 'text-indigo-400' : ''}`}>{item.song.title}</p>
              <p className="text-xs text-slate-500 truncate">{item.song.artist?.name || '未知'}</p>
              {item.reason && <p className="text-xs text-indigo-400/70 truncate mt-1">{item.reason}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
