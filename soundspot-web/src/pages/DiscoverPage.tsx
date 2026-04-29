import { useEffect, useState } from 'react';
import { RefreshCw, Play } from 'lucide-react';
import { getDaily } from '../api/recommend';
import type { RecommendItem } from '../api/types';
import { useNavigate } from 'react-router-dom';

export default function DiscoverPage() {
  const [items, setItems] = useState<RecommendItem[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try { const r = await getDaily(); setItems(r.items); } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">发现音乐</h1>
        <button onClick={load} disabled={loading} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 transition-colors">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> 刷新
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {items.map((item, i) => (
          <div key={i} onClick={() => item.song.id && navigate(`/song/${item.song.id}`)} className="group cursor-pointer rounded-xl p-3 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/10" style={{ background: '#1a1a2e' }}>
            <div className="aspect-square rounded-lg mb-3 overflow-hidden relative">
              <img src={item.song.cover_url || `https://picsum.photos/seed/disc${i}/300/300`} alt={item.song.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Play size={32} className="text-white" />
              </div>
            </div>
            <p className="text-sm font-medium truncate">{item.song.title}</p>
            <p className="text-xs text-slate-500 truncate">{item.song.artist?.name || '未知'}</p>
            {item.reason && <p className="text-xs text-indigo-400/70 truncate mt-1">{item.reason}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
