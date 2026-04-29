import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Play, Clock } from 'lucide-react';
import { getDaily } from '../api/recommend';
import { getHistory } from '../api/recognize';
import type { RecommendItem, RecognizeRecord } from '../api/types';

export default function HomePage() {
  const navigate = useNavigate();
  const [recommends, setRecommends] = useState<RecommendItem[]>([]);
  const [history, setHistory] = useState<RecognizeRecord[]>([]);

  useEffect(() => {
    getDaily().then(r => setRecommends(r.items)).catch(() => {});
    getHistory().then(r => setHistory(r.slice(0, 5))).catch(() => {});
  }, []);

  const formatDuration = (s: number | null) => s ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : '--:--';

  return (
    <div className="max-w-6xl mx-auto p-8">
      {/* 识别按钮 */}
      <div className="flex flex-col items-center py-12 mb-10">
        <button
          onClick={() => navigate('/recognize')}
          className="relative w-28 h-28 rounded-full bg-indigo-500 hover:bg-indigo-600 flex items-center justify-center transition-all duration-300 hover:scale-105 group"
        >
          <div className="absolute inset-0 rounded-full bg-indigo-500 animate-pulse-ring" />
          <Mic size={40} className="text-white relative z-10 group-hover:scale-110 transition-transform" />
        </button>
        <p className="mt-4 text-lg text-slate-400">点击识别音乐</p>
      </div>

      {/* 每日推荐 */}
      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Play size={20} className="text-indigo-400" /> 每日推荐</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {recommends.map((item, i) => (
            <div key={i} className="group cursor-pointer rounded-xl p-3 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/10" style={{ background: '#1a1a2e' }}>
              <div className="aspect-square rounded-lg mb-3 overflow-hidden">
                <img src={item.song.cover_url || `https://picsum.photos/seed/song${i}/300/300`} alt={item.song.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
              </div>
              <p className="text-sm font-medium truncate">{item.song.title}</p>
              <p className="text-xs text-slate-500 truncate">{item.song.artist?.name || '未知艺人'}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 最近识别 */}
      <section>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Clock size={20} className="text-pink-400" /> 最近识别</h2>
        {history.length === 0 ? (
          <p className="text-slate-500 text-sm">暂无识别记录</p>
        ) : (
          <div className="space-y-2">
            {history.map((r) => (
              <div key={r.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer" style={{ background: '#1a1a2e' }}>
                <img src={r.song?.cover_url || `https://picsum.photos/seed/rec${r.id}/60/60`} alt="" className="w-12 h-12 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{r.song?.title || '未识别'}</p>
                  <p className="text-xs text-slate-500 truncate">{r.song?.artist?.name || '--'}</p>
                </div>
                {r.confidence && <span className="text-xs text-indigo-400">{(r.confidence * 100).toFixed(0)}%</span>}
                <span className="text-xs text-slate-600">{formatDuration(r.song?.duration || null)}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
