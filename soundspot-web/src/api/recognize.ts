import client from './client';
import { Song } from './songs';

export interface RecognizeResult { song: Song | null; confidence: number | null; match_type: string | null; offset_ms: number | null; }
export interface RecognizeResponse { task_id: string; status: string; result: RecognizeResult | null; message?: string; }
export interface RecognizeRecord { id: string; song: Song | null; confidence: number | null; match_type: string | null; audio_duration: number | null; note: string | null; created_at: string; }

export const uploadAudio = (file: File) => {
  const form = new FormData();
  form.append('audio', file);
  return client.post<RecognizeResponse>('/api/v1/recognize/upload', form).then(r => r.data);
};
export const getHistory = () => client.get<RecognizeRecord[]>('/api/v1/recognize/history').then(r => r.data);
