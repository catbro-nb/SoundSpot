import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Home, Mic, Compass, Library, Search, LogOut, Music } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

const navItems = [
  { to: '/', icon: Home, label: '首页' },
  { to: '/recognize', icon: Mic, label: '识别' },
  { to: '/discover', icon: Compass, label: '发现' },
  { to: '/library', icon: Library, label: '音乐库' },
  { to: '/search', icon: Search, label: '搜索' },
];

export default function Layout() {
  const [expanded, setExpanded] = useState(false);
  const { user, logout, fetchMe } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => { fetchMe(); }, [fetchMe]);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* 侧边栏 */}
      <aside
        className={`${expanded ? 'w-60' : 'w-16'} flex flex-col border-r transition-all duration-300`}
        style={{ background: '#12122a', borderColor: '#2d2d4a' }}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 h-16 border-b" style={{ borderColor: '#2d2d4a' }}>
          <Music size={24} className="text-indigo-500 shrink-0" />
          {expanded && <span className="text-lg font-bold whitespace-nowrap">SoundSpot</span>}
        </div>

        {/* 导航 */}
        <nav className="flex-1 py-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`
              }
            >
              <Icon size={20} className="shrink-0" />
              {expanded && <span className="whitespace-nowrap text-sm">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* 用户信息 */}
        <div className="border-t p-3" style={{ borderColor: '#2d2d4a' }}>
          {expanded && (
            <div className="mb-2 px-2">
              <p className="text-sm font-medium truncate">{user?.nickname || '用户'}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email || ''}</p>
            </div>
          )}
          <button onClick={handleLogout} className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
            <LogOut size={18} className="shrink-0" />
            {expanded && <span className="text-sm">退出</span>}
          </button>
        </div>
      </aside>

      {/* 主内容 */}
      <main className="flex-1 overflow-y-auto" style={{ background: '#0f0f1a' }}>
        <Outlet />
      </main>
    </div>
  );
}
