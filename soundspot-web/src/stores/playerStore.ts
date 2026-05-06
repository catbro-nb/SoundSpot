import { create } from 'zustand';
import type { Song } from '../api/types';

interface PlayerState {
  currentSong: Song | null;
  isPlaying: boolean;
  progress: number;       // 0-100
  currentTime: number;    // seconds
  duration: number;       // seconds
  volume: number;         // 0-1
  queue: Song[];
  queueIndex: number;
  play: (song: Song) => void;
  pause: () => void;
  resume: () => void;
  toggle: (song?: Song) => void;
  seek: (percent: number) => void;
  setVolume: (v: number) => void;
  next: () => void;
  prev: () => void;
  setQueue: (songs: Song[], startIndex?: number) => void;
  setProgress: (currentTime: number, duration: number) => void;
}

let audio: HTMLAudioElement | null = null;

function getAudio(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio();
    audio.volume = 0.8;
  }
  return audio;
}

// 构建完整音频 URL
function buildAudioUrl(audioUrl: string | null): string | null {
  if (!audioUrl) return null;
  // 已经是完整 URL
  if (audioUrl.startsWith('http')) return audioUrl;
  // 相对路径，加后端地址
  return `http://localhost:8001${audioUrl}`;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentSong: null,
  isPlaying: false,
  progress: 0,
  currentTime: 0,
  duration: 0,
  volume: 0.8,
  queue: [],
  queueIndex: -1,

  play: (song: Song) => {
    const a = getAudio();
    const url = buildAudioUrl(song.audio_url);
    if (!url) return;
    a.src = url;
    a.play().catch(() => {});
    set({ currentSong: song, isPlaying: true, progress: 0, currentTime: 0, duration: 0 });
  },

  pause: () => {
    const a = getAudio();
    a.pause();
    set({ isPlaying: false });
  },

  resume: () => {
    const a = getAudio();
    if (a.src) {
      a.play().catch(() => {});
      set({ isPlaying: true });
    }
  },

  toggle: (song?: Song) => {
    const { currentSong, isPlaying, play, pause, resume } = get();
    if (song) {
      if (currentSong?.id === song.id) {
        isPlaying ? pause() : resume();
      } else {
        play(song);
      }
    } else {
      isPlaying ? pause() : resume();
    }
  },

  seek: (percent: number) => {
    const a = getAudio();
    if (a.duration) {
      a.currentTime = (percent / 100) * a.duration;
    }
  },

  setVolume: (v: number) => {
    const a = getAudio();
    a.volume = v;
    set({ volume: v });
  },

  next: () => {
    const { queue, queueIndex } = get();
    if (queue.length === 0) return;
    const nextIdx = (queueIndex + 1) % queue.length;
    get().play(queue[nextIdx]);
    set({ queueIndex: nextIdx });
  },

  prev: () => {
    const { queue, queueIndex } = get();
    if (queue.length === 0) return;
    const prevIdx = (queueIndex - 1 + queue.length) % queue.length;
    get().play(queue[prevIdx]);
    set({ queueIndex: prevIdx });
  },

  setQueue: (songs: Song[], startIndex = 0) => {
    set({ queue: songs, queueIndex: startIndex });
    if (songs.length > 0 && startIndex < songs.length) {
      get().play(songs[startIndex]);
    }
  },

  setProgress: (currentTime: number, duration: number) => {
    set({
      currentTime,
      duration,
      progress: duration > 0 ? (currentTime / duration) * 100 : 0,
    });
  },
}));

// 监听 audio 事件更新进度
if (typeof window !== 'undefined') {
  const a = getAudio();
  a.addEventListener('timeupdate', () => {
    usePlayerStore.getState().setProgress(a.currentTime, a.duration);
  });
  a.addEventListener('ended', () => {
    usePlayerStore.getState().next();
  });
  a.addEventListener('error', () => {
    console.error('Audio playback error');
  });
}
