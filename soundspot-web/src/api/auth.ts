import client from './client';

export interface LoginReq { email: string; password: string; }
export interface RegisterReq { email: string; password: string; nickname: string; }
export interface TokenRes { access_token: string; refresh_token: string; token_type: string; }
export interface UserRes { id: string; email: string; nickname: string; avatar_url: string | null; status: string; created_at: string; }

export const login = (data: LoginReq) => client.post<TokenRes>('/api/v1/auth/login', data).then(r => r.data);
export const register = (data: RegisterReq) => client.post<UserRes>('/api/v1/auth/register', data).then(r => r.data);
export const getMe = () => client.get<UserRes>('/api/v1/auth/me').then(r => r.data);
export const refreshToken = (refresh_token: string) => client.post<TokenRes>('/api/v1/auth/refresh', { refresh_token }).then(r => r.data);
