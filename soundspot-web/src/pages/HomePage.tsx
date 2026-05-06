import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Play, Clock, Pause } from 'lucide-react';
import { getDaily } from '../api/recommend';
import { getHistory } from '../api/recognize';
import type { RecommendItem, RecognizeRecord, Song } from '../api/types';
import { usePlayerStore } from '../stores/playerStore';

export default function HomePage() {
  const navigate = useNavigate();
  const [recommends, setRecommends] = useState<RecommendItem[]>([]);
  const [history, setHistory] = useState<RecognizeRecord[]>([]);
  const { currentSong, isPlaying, toggle, setQueue } = usePlayerStore();

  useEffect(() => {
    getDaily().then(r => setRecommends(r.items)).catch(() => {});
    getHistory().then(r => setHistory(r.slice(0, 5))).catch(() => {});
  }, []);

  const formatDuration = (s: number | null) => s ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : '--:--';

  const handlePlaySong = (song: Song, allSongs?: Song[]) => {
    if (allSongs) {
      const idx = allSongs.findIndex(s => s.id === song.id);
      setQueue(allSongs, idx >= 0 ? idx : 0);
    } else {
      toggle(song);
    }
  };

  const allRecommendSongs = recommends.map(r => r.song);

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
          {recommends.map((item, i) => {
            const isCurrent = currentSong?.id === item.song.id;
            const isActive = isCurrent && isPlaying;
            return (
              <div
                key={i}
                className="group cursor-pointer rounded-xl p-3 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/10 relative"
                style={{ background: '#1a1a2e' }}
                onClick={() => navigate(`/song/${item.song.id}`)}
              >
                <div className="aspect-square rounded-lg mb-3 overflow-hidden relative">
                  <img src={item.song.cover_url || `https://picsum.photos/seed/song${i}/300/300`} alt={item.song.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                  {/* 播放按钮遮罩 */}
                  <div
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    onClick={(e) => { e.stopPropagation(); handlePlaySong(item.song, allRecommendSongs); }}
                  >
                    <div className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center shadow-lg">
                      {isActive ? <Pause size={22} className="text-white" /> : <Play size={22} className="text-white ml-1" />}
                    </div>
                  </div>
                  {/* 正在播放指示 */}
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
                <p className="text-sm font-medium truncate">{item.song.title}</p>
                <p className="text-xs text-slate-500 truncate">{item.song.artist?.name || '未知艺人'}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 最近识别 */}
      <section>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Clock size={20} className="text-pink-400" /> 最近识别</h2>
        {history.length === 0 ? (
          <p className="text-slate-500 text-sm">暂无识别记录</p>
        ) : (
          <div className="space-y-2">
            {history.map((r) => {
              const isCurrent = r.song && currentSong?.id === r.song.id;
              const isActive = isCurrent && isPlaying;
              return (
                <div
                  key={r.id}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group"
                  style={{ background: '#1a1a2e' }}
                  onClick={() => r.song && navigate(`/song/${r.song.id}`)}
                >
                  <div className="relative shrink-0">
                    <img src={r.song?.cover_url || `https://picsum.photos/seed/rec${r.id}/60/60`} alt="" className="w-12 h-12 rounded-lg object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                      {isActive ? <Pause size={16} className="text-white" /> : <Play size={16} className="text-white ml-0.5" />}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isCurrent ? 'text-indigo-400' : ''}`}>{r.song?.title || '未识别'}</p>
                    <p className="text-xs text-slate-500 truncate">{r.song?.artist?.name || '--'}</p>
                  </div>
                  {r.confidence && <span className="text-xs text-indigo-400">{(r.confidence * 100).toFixed(0)}%</span>}
                  <span className="text-xs text-slate-600">{formatDuration(r.song?.duration || null)}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
