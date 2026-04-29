export interface ArtistBrief { id: string; name: string; avatar_url: string | null; }
export interface AlbumBrief { id: string; title: string; cover_url: string | null; }
export interface Song { id: string; title: string; artist: ArtistBrief | null; album: AlbumBrief | null; duration: number | null; genre: string | null; cover_url: string | null; audio_url: string | null; release_date: string | null; }
export interface RecognizeResult { song: Song | null; confidence: number | null; match_type: string | null; offset_ms: number | null; }
export interface RecognizeResponse { task_id: string; status: string; result: RecognizeResult | null; message?: string; }
export interface RecognizeRecord { id: string; song: Song | null; confidence: number | null; match_type: string | null; audio_duration: number | null; note: string | null; created_at: string; }
export interface RecommendItem { song: Song; reason: string | null; reason_type: string | null; confidence: number | null; }
export interface RecommendResponse { total: number; items: RecommendItem[]; refreshed_at: string | null; }
export interface Playlist { id: string; name: string; description: string | null; cover_url: string | null; is_public: boolean; song_count: number; created_at: string; updated_at: string; }
