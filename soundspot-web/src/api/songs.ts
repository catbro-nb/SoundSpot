import client from './client';

export interface ArtistBrief { id: string; name: string; avatar_url: string | null; }
export interface AlbumBrief { id: string; title: string; cover_url: string | null; }
export interface Song { id: string; title: string; artist: ArtistBrief | null; album: AlbumBrief | null; duration: number | null; genre: string | null; cover_url: string | null; audio_url: string | null; release_date: string | null; }

export const searchSongs = (q: string) => client.get<Song[]>('/api/v1/songs/', { params: { q } }).then(r => r.data);
export const getSong = (id: string) => client.get<Song>(`/api/v1/songs/${id}`).then(r => r.data);
