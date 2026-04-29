import client from './client';
import type { Song } from './types';

export interface RecommendItem { song: Song; reason: string | null; reason_type: string | null; confidence: number | null; }
export interface RecommendResponse { total: number; items: RecommendItem[]; refreshed_at: string | null; }

export const getDaily = () => client.get<RecommendResponse>('/api/v1/recommend/daily').then(r => r.data);
export const getSimilar = (songId: string) => client.get<RecommendResponse>(`/api/v1/recommend/similar/${songId}`).then(r => r.data);
