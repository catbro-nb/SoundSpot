import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Square, Loader2, Music, Volume2 } from 'lucide-react';
import { uploadAudio, getHistory } from '../api/recognize';
import type { RecognizeResponse, RecognizeRecord } from '../api/types';

const MIN_RECORD_SECONDS = 5; // 最少录音秒数

export default function RecognizePage() {
  const navigate = useNavigate();
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RecognizeResponse | null>(null);
  const [history, setHistory] = useState<RecognizeRecord[]>([]);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => { getHistory().then(r => setHistory(r)).catch(() => {}); }, []);

  // 录音计时
  useEffect(() => {
    if (recording) {
      startTimeRef.current = Date.now();
      setRecordSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 200);
    } else {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [recording]);

  const canStop = recordSeconds >= MIN_RECORD_SECONDS;

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,  // 关闭回声消除，保留原始音频
          noiseSuppression: false,  // 关闭降噪，保留更多细节
          autoGainControl: true,    // 自动增益
        }
      });

      // 优先用 webm，不支持则用浏览器默认
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/ogg;codecs=opus';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = '';
      }

      const options: MediaRecorderOptions = mimeType ? { mimeType } : {};
      const mediaRecorder = new MediaRecorder(stream, options);

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      // 每500ms收集一次数据，更可靠
      mediaRecorder.start(500);
      setRecording(true);
      setResult(null);
    } catch {
      alert('无法访问麦克风，请检查浏览器权限设置');
    }
  };

  const stopRecording = useCallback(async () => {
    if (!canStop) return;
    const mr = mediaRecorderRef.current;
    if (!mr) return;

    mr.stop();
    mr.stream.getTracks().forEach(t => t.stop());
    setRecording(false);
    setLoading(true);

    await new Promise<void>(resolve => { mr.onstop = () => resolve(); });

    const finalMime = mr.mimeType || 'audio/webm';
    const ext = finalMime.includes('ogg') ? 'ogg' : 'webm';
    const blob = new Blob(chunksRef.current, { type: finalMime });
    const file = new File([blob], `recording.${ext}`, { type: finalMime });

    try {
      const res = await uploadAudio(file);
      setResult(res);
      const h = await getHistory();
      setHistory(h);
    } catch {
      setResult({ task_id: '', status: 'failed', result: null, message: '识别请求失败，请重试' });
    } finally {
      setLoading(false);
    }
  }, [canStop]);

  const formatDuration = (s: number | null) => s ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : '--:--';

  const formatRecordTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold text-center mb-2">听音识曲</h1>
      <p className="text-center text-slate-400 text-sm mb-8">打开音乐，点击录音，让 SoundSpot 听一听</p>

      {/* 录音区域 */}
      <div className="flex flex-col items-center mb-10">
        {/* 录音按钮 */}
        <button
          onClick={recording ? stopRecording : startRecording}
          disabled={recording && !canStop}
          className={`relative w-36 h-36 rounded-full flex items-center justify-center transition-all duration-300 ${
            recording
              ? canStop
                ? 'bg-red-500 hover:bg-red-600 hover:scale-105 cursor-pointer'
                : 'bg-red-500/50 cursor-not-allowed'
              : 'bg-indigo-500 hover:bg-indigo-600 hover:scale-105'
          }`}
        >
          {/* 录音脉冲环 */}
          {recording && <div className="absolute inset-0 rounded-full bg-red-500 animate-pulse-ring" />}

          {recording ? (
            <Square size={36} className="text-white relative z-10" />
          ) : (
            <Mic size={44} className="text-white" />
          )}
        </button>

        {/* 录音状态 */}
        <div className="mt-4 text-center">
          {!recording && !loading && (
            <p className="text-slate-300">点击开始录音</p>
          )}
          {recording && !canStop && (
            <p className="text-slate-400">
              录音中... 至少需要 {MIN_RECORD_SECONDS - recordSeconds} 秒
            </p>
          )}
          {recording && canStop && (
            <p className="text-red-400 font-medium">点击停止录音</p>
          )}
        </div>

        {/* 录音计时器 */}
        {recording && (
          <div className="mt-3 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-2xl font-mono text-white tabular-nums">
              {formatRecordTime(recordSeconds)}
            </span>
          </div>
        )}

        {/* 波形动画 */}
        {recording && (
          <div className="flex items-center gap-1 mt-4 h-8">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="w-1.5 bg-indigo-400 rounded-full wave-bar"
                style={{ animationDelay: `${i * 0.08}s` }}
              />
            ))}
          </div>
        )}

        {/* 加载状态 */}
        {loading && (
          <div className="flex items-center gap-3 mt-6 text-indigo-400">
            <Loader2 size={22} className="animate-spin" />
            <span className="text-lg">正在分析音频...</span>
          </div>
        )}

        {/* 使用提示 */}
        {!recording && !loading && !result && (
          <div className="mt-8 px-6 py-4 rounded-xl border text-center max-w-sm" style={{ background: '#1a1a2e', borderColor: '#2d2d4a' }}>
            <Volume2 size={24} className="mx-auto mb-2 text-indigo-400" />
            <p className="text-slate-300 text-sm font-medium mb-1">使用建议</p>
            <ul className="text-slate-400 text-xs space-y-1 text-left">
              <li>1. 将手机靠近电脑麦克风播放音乐</li>
              <li>2. 点击录音后等待 5 秒以上</li>
              <li>3. 尽量在安静环境中使用</li>
              <li>4. 当前支持识别库中的 9 首歌曲</li>
            </ul>
          </div>
        )}
      </div>

      {/* 识别结果 */}
      {result && (
        <div className="rounded-xl p-6 mb-8 border" style={{ background: '#1a1a2e', borderColor: '#2d2d4a' }}>
          {result.result?.song ? (
            <div
              className="flex items-center gap-5 cursor-pointer group"
              onClick={() => navigate(`/song/${result.result!.song!.id}`)}
            >
              <div className="relative">
                <img
                  src={result.result.song.cover_url || `https://picsum.photos/seed/detail/120/120`}
                  alt=""
                  className="w-20 h-20 rounded-xl object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 rounded-xl bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Music size={24} className="text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold group-hover:text-indigo-400 transition-colors">{result.result.song.title}</h3>
                <p className="text-slate-400 text-sm">{result.result.song.artist?.name || '未知艺人'}</p>
                <p className="text-slate-500 text-xs mt-1">
                  {result.result.song.album?.title || ''} · {formatDuration(result.result.song.duration)}
                </p>
                <p className="text-indigo-400/60 text-xs mt-2 group-hover:text-indigo-400 transition-colors">点击查看详情 →</p>
              </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-indigo-400">
                    {((result.result.confidence || 0) * 100).toFixed(0)}%
                  </span>
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
            <div
              key={r.id}
              className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-white/5 transition-colors"
              style={{ background: '#1a1a2e' }}
              onClick={() => r.song && navigate(`/song/${r.song.id}`)}
            >
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
