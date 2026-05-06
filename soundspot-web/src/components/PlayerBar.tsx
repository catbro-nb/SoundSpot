import { useNavigate } from 'react-router-dom';
import { usePlayerStore } from '../stores/playerStore';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';

export default function PlayerBar() {
  const navigate = useNavigate();
  const { currentSong, isPlaying, progress, currentTime, duration, volume, toggle, next, prev, seek, setVolume } = usePlayerStore();

  if (!currentSong) return null;

  const formatTime = (s: number) => {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 border-t"
      style={{ background: '#12122a', borderColor: '#2d2d4a' }}
    >
      {/* 进度条 */}
      <div
        className="h-1 cursor-pointer group relative"
        style={{ background: '#2d2d4a' }}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const percent = ((e.clientX - rect.left) / rect.width) * 100;
          seek(percent);
        }}
      >
        <div
          className="h-full bg-indigo-500 transition-all duration-200 relative"
          style={{ width: `${progress}%` }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-indigo-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      <div className="flex items-center px-4 py-2 gap-4">
        {/* 歌曲信息 */}
        <div
          className="flex items-center gap-3 w-64 min-w-0 cursor-pointer hover:bg-white/5 -ml-1 px-1 py-1 rounded-lg transition-colors"
          onClick={() => currentSong && navigate(`/song/${currentSong.id}`)}
        >
          <img
            src={currentSong.cover_url || `https://picsum.photos/seed/${currentSong.id}/60/60`}
            alt=""
            className="w-11 h-11 rounded-lg object-cover shrink-0"
          />
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{currentSong.title}</p>
            <p className="text-xs text-slate-500 truncate">{currentSong.artist?.name || '未知艺人'}</p>
          </div>
        </div>

        {/* 播放控制 */}
        <div className="flex-1 flex items-center justify-center gap-4">
          <button onClick={prev} className="text-slate-400 hover:text-white transition-colors">
            <SkipBack size={18} />
          </button>
          <button
            onClick={() => toggle()}
            className="w-9 h-9 rounded-full bg-indigo-500 hover:bg-indigo-600 flex items-center justify-center transition-colors"
          >
            {isPlaying ? <Pause size={18} className="text-white" /> : <Play size={18} className="text-white ml-0.5" />}
          </button>
          <button onClick={next} className="text-slate-400 hover:text-white transition-colors">
            <SkipForward size={18} />
          </button>
          <span className="text-xs text-slate-500 ml-2">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>

        {/* 音量 */}
        <div className="flex items-center gap-2 w-36">
          <button
            onClick={() => setVolume(volume > 0 ? 0 : 0.8)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            {volume > 0 ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-20 h-1 accent-indigo-500 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
