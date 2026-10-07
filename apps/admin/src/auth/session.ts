import { create } from 'zustand';

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  avatarMediaId: string | null;
  roles: string[];
  permissions: string[];
}

interface SessionState {
  /** Access token chi giu trong memory (khong localStorage) — refresh token nam trong cookie httpOnly. */
  accessToken: string | null;
  user: SessionUser | null;
  status: 'unknown' | 'authenticated' | 'anonymous';
  setSession: (accessToken: string, user: SessionUser) => void;
  setUser: (user: SessionUser) => void;
  clear: () => void;
}

export const useSession = create<SessionState>((set) => ({
  accessToken: null,
  user: null,
  status: 'unknown',
  setSession: (accessToken, user) => set({ accessToken, user, status: 'authenticated' }),
  setUser: (user) => set({ user }),
  clear: () => set({ accessToken: null, user: null, status: 'anonymous' }),
}));

export function hasPermission(user: SessionUser | null, permission: string): boolean {
  return !!user && (user.roles.includes('SuperAdmin') || user.permissions.includes(permission));
}

export function usePermission(permission: string): boolean {
  return useSession((s) => hasPermission(s.user, permission));
}
