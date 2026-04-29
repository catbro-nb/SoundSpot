import { useState, useRef } from 'react';
import { Mic, Square, Loader2, Music } from 'lucide-react';
import { uploadAudio, getHistory } from '../api/recognize';
import type { RecognizeResponse, RecognizeRecord } from '../api/types';
import { useEffect } from 'react';

export default function RecognizePage() {
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RecognizeResponse | null>(null);
  const [history, setHistory] = useState<RecognizeRecord[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => { getHistory().then(r => setHistory(r)).catch(() => {}); }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mediaRecorder.start();
      setRecording(true);
      setResult(null);
    } catch {
      alert('无法访问麦克风，请检查权限');
    }
  };

  const stopRecording = async () => {
    const mr = mediaRecorderRef.current;
    if (!mr) return;
    mr.stop();
    mr.stream.getTracks().forEach(t => t.stop());
    setRecording(false);
    setLoading(true);

    await new Promise<void>(resolve => { mr.onstop = () => resolve(); });
    const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
    const file = new File([blob], 'recording.webm', { type: 'audio/webm' });

    try {
      const res = await uploadAudio(file);
      setResult(res);
      const h = await getHistory();
      setHistory(h);
    } catch {
      setResult({ task_id: '', status: 'failed', result: null, message: '识别请求失败' });
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (s: number | null) => s ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : '--:--';

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold text-center mb-10">音乐识别</h1>

      {/* 录音按钮 */}
      <div className="flex flex-col items-center mb-10">
        <button
          onClick={recording ? stopRecording : startRecording}
          className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105 ${
            recording ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-500 hover:bg-indigo-600'
          }`}
        >
          {recording && <div className="absolute inset-0 rounded-full bg-red-500 animate-pulse-ring" />}
          {recording ? <Square size={36} className="text-white relative z-10" /> : <Mic size={40} className="text-white" />}
        </button>
        <p className="mt-4 text-slate-400">{recording ? '点击停止录音' : '点击开始录音'}</p>

        {/* 波形动画 */}
        {recording && (
          <div className="flex items-center gap-1 mt-6 h-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="w-1.5 bg-indigo-400 rounded-full wave-bar" style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
        )}

        {/* 加载 */}
        {loading && (
          <div className="flex items-center gap-2 mt-6 text-indigo-400">
            <Loader2 size={20} className="animate-spin" />
            <span>识别中...</span>
          </div>
        )}
      </div>

      {/* 识别结果 */}
      {result && (
        <div className="rounded-xl p-6 mb-8 border" style={{ background: '#1a1a2e', borderColor: '#2d2d4a' }}>
          {result.result?.song ? (
            <div className="flex items-center gap-5">
              <img src={result.result.song.cover_url || `https://picsum.photos/seed/detail/120/120`} alt="" className="w-20 h-20 rounded-xl object-cover" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{result.result.song.title}</h3>
                <p className="text-slate-400 text-sm">{result.result.song.artist?.name || '未知艺人'}</p>
                <p className="text-slate-500 text-xs mt-1">{result.result.song.album?.title || ''} · {formatDuration(result.result.song.duration)}</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-indigo-400">{((result.result.confidence || 0) * 100).toFixed(0)}%</span>
                <p className="text-xs text-slate-500">匹配度</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-slate-400">
              <Music size={24} />
              <p>{result.message || '未识别到歌曲'}</p>
            </div>
          )}
        </div>
      )}

      {/* 识别历史 */}
      <section>
        <h2 className="text-lg font-bold mb-3">识别历史</h2>
        <div className="space-y-2">
          {history.map((r) => (
            <div key={r.id} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: '#1a1a2e' }}>
              <img src={r.song?.cover_url || `https://picsum.photos/seed/h${r.id}/48/48`} alt="" className="w-10 h-10 rounded-lg object-cover" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{r.song?.title || '未识别'}</p>
                <p className="text-xs text-slate-500">{r.song?.artist?.name || '--'}</p>
              </div>
              {r.confidence && <span className="text-xs text-indigo-400">{(r.confidence * 100).toFixed(0)}%</span>}
            </div>
          ))}
          {history.length === 0 && <p className="text-slate-500 text-sm">暂无记录</p>}
        </div>
      </section>
    </div>
  );
}
