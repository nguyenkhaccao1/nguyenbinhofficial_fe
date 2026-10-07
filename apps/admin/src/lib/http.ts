import { ApiError, requestJson, type RequestOptions } from '@nb/shared';
import { useSession, type SessionUser } from '@/auth/session';

const API_BASE = '/api/v1';

export interface LoginResponse {
  accessToken: string;
  expiresAt: string;
  user: SessionUser;
}

/** Header bat buoc cho endpoint dung cookie refresh (chong CSRF). */
const ANTI_FORGERY = { 'X-Requested-With': 'nb-admin' };

let refreshing: Promise<boolean> | null = null;

/**
 * Lay access token moi tu cookie refresh. Single-flight trong tab; giua nhieu tab dung Web Locks de
 * khong gui 2 refresh cung luc (backend coi viec dung lai token cu la bi danh cap va huy ca phien).
 */
export function refreshSession(): Promise<boolean> {
  refreshing ??= withCrossTabLock(async () => {
    try {
      const result = await requestJson<LoginResponse>(API_BASE, '/admin/auth/refresh', {
        method: 'POST',
        headers: ANTI_FORGERY,
        credentials: 'same-origin',
      });
      useSession.getState().setSession(result.accessToken, result.user);
      return true;
    } catch {
      useSession.getState().clear();
      return false;
    }
  }).finally(() => {
    refreshing = null;
  });
  return refreshing;
}

async function withCrossTabLock<T>(fn: () => Promise<T>): Promise<T> {
  if (typeof navigator !== 'undefined' && 'locks' in navigator) {
    return navigator.locks.request('nb-admin-refresh', fn);
  }
  return fn();
}

/** Goi API admin: gan Bearer, gap 401 thi refresh 1 lan roi thu lai. */
export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const call = () => {
    const token = useSession.getState().accessToken;
    return requestJson<T>(API_BASE, path, {
      ...options,
      credentials: 'same-origin',
      headers: { ...options.headers, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
  };

  try {
    return await call();
  } catch (error) {
    if (error instanceof ApiError && error.status === 401 && !path.startsWith('/admin/auth/login')) {
      if (await refreshSession()) return call();
    }
    throw error;
  }
}

export async function login(email: string, password: string, rememberMe: boolean) {
  const result = await requestJson<LoginResponse>(API_BASE, '/admin/auth/login', {
    method: 'POST',
    body: { email, password, rememberMe },
    credentials: 'same-origin',
  });
  useSession.getState().setSession(result.accessToken, result.user);
  return result.user;
}

export async function logout() {
  try {
    await requestJson(API_BASE, '/admin/auth/logout', {
      method: 'POST',
      headers: ANTI_FORGERY,
      credentials: 'same-origin',
    });
  } finally {
    useSession.getState().clear();
  }
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const result = await api<LoginResponse>('/admin/auth/change-password', {
    method: 'POST',
    body: { currentPassword, newPassword },
  });
  useSession.getState().setSession(result.accessToken, result.user);
}
