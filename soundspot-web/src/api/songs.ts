import client from './client';
import type { Song } from './types';

export type { Song };

export const searchSongs = (q: string) => client.get<Song[]>('/api/v1/songs/', { params: { q } }).then(r => r.data);
export const getSong = (id: string) => client.get<Song>(`/api/v1/songs/${id}`).then(r => r.data);
