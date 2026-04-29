import client from './client';

export interface Playlist { id: string; name: string; description: string | null; cover_url: string | null; is_public: boolean; song_count: number; created_at: string; updated_at: string; }

export const getPlaylists = () => client.get<Playlist[]>('/api/v1/playlists/').then(r => r.data);
export const createPlaylist = (data: { name: string; description?: string; is_public?: boolean }) => client.post<Playlist>('/api/v1/playlists/', data).then(r => r.data);
