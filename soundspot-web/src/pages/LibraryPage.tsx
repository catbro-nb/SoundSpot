import { useState, useEffect } from 'react';
import { Heart, ListMusic, Clock, Plus } from 'lucide-react';
import { getPlaylists, createPlaylist } from '../api/playlists';
import { getHistory } from '../api/recognize';
import type { Playlist, RecognizeRecord } from '../api/types';

const tabs = [
  { key: 'favorites', label: '收藏', icon: Heart },
  { key: 'playlists', label: '歌单', icon: ListMusic },
  { key: 'history', label: '播放历史', icon: Clock },
];

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState('favorites');
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [history, setHistory] = useState<RecognizeRecord[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    getPlaylists().then(r => setPlaylists(r)).catch(() => {});
    getHistory().then(r => setHistory(r)).catch(() => {});
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try { await createPlaylist({ name: newName }); const r = await getPlaylists(); setPlaylists(r); setShowCreate(false); setNewName(''); } catch {}
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">音乐库</h1>

      {/* Tab 切换 */}
      <div className="flex gap-2 mb-6">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
              activeTab === key ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:bg-white/5'
            }`}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {/* 收藏 */}
      {activeTab === 'favorites' && (
        <div className="text-center py-12 text-slate-500">
          <Heart size={48} className="mx-auto mb-3 opacity-30" />
          <p>收藏的歌曲会显示在这里</p>
        </div>
      )}

      {/* 歌单 */}
      {activeTab === 'playlists' && (
        <div>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 mb-4 rounded-lg bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 transition-colors">
            <Plus size={16} /> 新建歌单
          </button>
          {showCreate && (
            <div className="flex gap-2 mb-4">
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="歌单名称" className="flex-1 px-4 py-2 rounded-lg border text-sm" style={{ borderColor: '#2d2d4a', background: '#0f0f1a' }} />
              <button onClick={handleCreate} className="px-4 py-2 rounded-lg bg-indigo-500 text-white text-sm">创建</button>
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg text-slate-400 text-sm hover:bg-white/5">取消</button>
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {playlists.map(p => (
              <div key={p.id} className="p-4 rounded-xl cursor-pointer hover:bg-white/5 transition-colors" style={{ background: '#1a1a2e' }}>
                <div className="w-full aspect-square rounded-lg mb-3 flex items-center justify-center" style={{ background: '#2d2d4a' }}>
                  <ListMusic size={32} className="text-slate-600" />
                </div>
                <p className="text-sm font-medium truncate">{p.name}</p>
                <p className="text-xs text-slate-500">{p.song_count} 首歌曲</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 播放历史 */}
      {activeTab === 'history' && (
        <div className="space-y-2">
          {history.map(r => (
            <div key={r.id} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: '#1a1a2e' }}>
              <img src={r.song?.cover_url || `https://picsum.photos/seed/lib${r.id}/48/48`} alt="" className="w-10 h-10 rounded-lg object-cover" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{r.song?.title || '未识别'}</p>
                <p className="text-xs text-slate-500">{r.song?.artist?.name || '--'}</p>
              </div>
            </div>
          ))}
          {history.length === 0 && <p className="text-slate-500 text-sm">暂无记录</p>}
        </div>
      )}
    </div>
  );
}
