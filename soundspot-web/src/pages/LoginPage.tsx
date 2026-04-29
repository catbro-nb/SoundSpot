import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Music } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const { login, register, loading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        if (!nickname.trim()) { setError('请输入昵称'); return; }
        await register(email, password, nickname);
      }
      navigate('/');
    } catch {
      setError(isLogin ? '邮箱或密码错误' : '注册失败，邮箱可能已存在');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: '#0f0f1a' }}>
      {/* 装饰圆圈 */}
      <div className="absolute top-[-10%] left-[-5%] w-96 h-96 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)' }} />
      <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #ec4899 0%, transparent 70%)' }} />
      <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #818cf8 0%, transparent 70%)' }} />

      {/* 登录卡片 */}
      <div className="relative z-10 w-full max-w-md p-8 rounded-2xl border" style={{ background: '#1a1a2e', borderColor: '#2d2d4a' }}>
        <div className="flex items-center justify-center gap-3 mb-8">
          <Music size={32} className="text-indigo-500" />
          <h1 className="text-2xl font-bold">SoundSpot</h1>
        </div>

        <h2 className="text-xl font-semibold text-center mb-6">{isLogin ? '欢迎回来' : '创建账号'}</h2>

        {error && <div className="mb-4 p-3 rounded-lg bg-red-500/10 text-red-400 text-sm text-center">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <input
              type="text" placeholder="昵称" value={nickname} onChange={e => setNickname(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border bg-transparent text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              style={{ borderColor: '#2d2d4a', background: '#0f0f1a' }}
            />
          )}
          <input
            type="email" placeholder="邮箱" value={email} onChange={e => setEmail(e.target.value)} required
            className="w-full px-4 py-3 rounded-lg border bg-transparent text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            style={{ borderColor: '#2d2d4a', background: '#0f0f1a' }}
          />
          <input
            type="password" placeholder="密码" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
            className="w-full px-4 py-3 rounded-lg border bg-transparent text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            style={{ borderColor: '#2d2d4a', background: '#0f0f1a' }}
          />
          <button
            type="submit" disabled={loading}
            className="w-full py-3 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-medium transition-colors disabled:opacity-50"
          >
            {loading ? '处理中...' : isLogin ? '登录' : '注册'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-6">
          {isLogin ? '还没有账号？' : '已有账号？'}
          <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-indigo-400 hover:text-indigo-300 ml-1">
            {isLogin ? '注册' : '登录'}
          </button>
        </p>
      </div>
    </div>
  );
}
