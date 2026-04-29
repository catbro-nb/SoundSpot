import { create } from 'zustand';
import * as authApi from '../api/auth';
import type { UserRes } from '../api/auth';

interface AuthState {
  token: string | null;
  user: UserRes | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, nickname: string) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
  setTokens: (access: string, refresh: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('access_token'),
  user: null,
  loading: false,

  setTokens: (access, refresh) => {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    set({ token: access });
  },

  login: async (email, password) => {
    set({ loading: true });
    try {
      const res = await authApi.login({ email, password });
      localStorage.setItem('access_token', res.access_token);
      localStorage.setItem('refresh_token', res.refresh_token);
      set({ token: res.access_token, loading: false });
      const user = await authApi.getMe();
      set({ user });
    } catch {
      set({ loading: false });
      throw new Error('登录失败');
    }
  },

  register: async (email, password, nickname) => {
    set({ loading: true });
    try {
      await authApi.register({ email, password, nickname });
      const res = await authApi.login({ email, password });
      localStorage.setItem('access_token', res.access_token);
      localStorage.setItem('refresh_token', res.refresh_token);
      set({ token: res.access_token, loading: false });
      const user = await authApi.getMe();
      set({ user });
    } catch {
      set({ loading: false });
      throw new Error('注册失败');
    }
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    set({ token: null, user: null });
  },

  fetchMe: async () => {
    try {
      const user = await authApi.getMe();
      set({ user });
    } catch {
      set({ token: null, user: null });
    }
  },
}));
