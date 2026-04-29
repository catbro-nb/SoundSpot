import { useState, useEffect, useRef } from 'react';
import { Search as SearchIcon } from 'lucide-react';
import { searchSongs } from '../api/songs';
import type { Song } from '../api/types';
import { useNavigate } from 'react-router-dom';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const navigate = useNavigate();

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try { const r = await searchSongs(query); setResults(r); } catch { setResults([]); }
      setLoading(false);
    }, 400);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query]);

  const formatDuration = (s: number | null) => s ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : '--:--';

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">搜索</h1>

      {/* 搜索框 */}
      <div className="relative mb-8">
        <SearchIcon size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          value={query} onChange={e => setQuery(e.target.value)} placeholder="搜索歌曲、艺人..."
          className="w-full pl-12 pr-4 py-3 rounded-xl border text-sm focus:outline-none focus:border-indigo-500 transition-colors"
          style={{ background: '#1a1a2e', borderColor: '#2d2d4a' }}
        />
      </div>

      {/* 结果 */}
      {loading && <p className="text-slate-500 text-sm text-center">搜索中...</p>}
      {!loading && results.length === 0 && query && <p className="text-slate-500 text-sm text-center">未找到结果</p>}

      <div className="space-y-2">
        {results.map(song => (
          <div key={song.id} onClick={() => navigate(`/song/${song.id}`)} className="flex items-center gap-4 p-3 rounded-lg cursor-pointer hover:bg-white/5 transition-colors" style={{ background: '#1a1a2e' }}>
            <img src={song.cover_url || `https://picsum.photos/seed/s${song.id}/60/60`} alt="" className="w-12 h-12 rounded-lg object-cover" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{song.title}</p>
              <p className="text-xs text-slate-500 truncate">{song.artist?.name || '未知'} · {song.album?.title || ''}</p>
            </div>
            <span className="text-xs text-slate-600">{formatDuration(song.duration)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
