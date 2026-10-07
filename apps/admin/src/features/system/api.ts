import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PagedResult, QueryValue } from '@nb/shared';
import { api } from '@/lib/http';

export interface UserListItem {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
  isActive: boolean;
  isLockedOut: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface UserDetail extends UserListItem {
  phoneNumber: string | null;
  avatarMediaId: string | null;
  lockoutEnd: string | null;
  updatedAt: string | null;
}

export interface CreateUserInput {
  email: string;
  fullName: string;
  password: string;
  phoneNumber: string | null;
  roles: string[];
  isActive: boolean;
}

export interface UpdateUserInput {
  fullName: string;
  phoneNumber: string | null;
  roles: string[];
  isActive: boolean;
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  userCount: number;
  permissions: string[];
}

export interface PermissionDef {
  code: string;
  module: string;
  action: string;
}

export interface RoleInput {
  name: string;
  description: string | null;
  permissions: string[];
}

export interface AuditLog {
  id: string;
  userId: string | null;
  userName: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  oldValues: string | null;
  newValues: string | null;
  changedColumns: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  correlationId: string | null;
  createdAt: string;
}

const keys = {
  users: ['users'] as const,
  roles: ['roles'] as const,
  permissions: ['permissions'] as const,
  audit: ['audit-logs'] as const,
};

export function useUsers(query: Record<string, QueryValue>) {
  return useQuery({
    queryKey: [...keys.users, query],
    queryFn: ({ signal }) => api<PagedResult<UserListItem>>('/admin/users', { query, signal }),
    placeholderData: keepPreviousData,
  });
}

export function useUser(id: string | null) {
  return useQuery({
    queryKey: [...keys.users, 'detail', id],
    queryFn: ({ signal }) => api<UserDetail>(`/admin/users/${id}`, { signal }),
    enabled: !!id,
  });
}

export function useUserMutations() {
  const client = useQueryClient();
  const invalidate = () => client.invalidateQueries({ queryKey: keys.users });
  const onSuccess = () => {
    void invalidate();
    void client.invalidateQueries({ queryKey: keys.roles }); // so nguoi dung theo role
  };

  return {
    create: useMutation({
      mutationFn: (input: CreateUserInput) => api<UserDetail>('/admin/users', { method: 'POST', body: input }),
      onSuccess,
    }),
    update: useMutation({
      mutationFn: ({ id, input }: { id: string; input: UpdateUserInput }) =>
        api<UserDetail>(`/admin/users/${id}`, { method: 'PUT', body: input }),
      onSuccess,
    }),
    remove: useMutation({
      mutationFn: (id: string) => api(`/admin/users/${id}`, { method: 'DELETE' }),
      onSuccess,
    }),
    lock: useMutation({
      mutationFn: (id: string) => api(`/admin/users/${id}/lock`, { method: 'POST' }),
      onSuccess: invalidate,
    }),
    unlock: useMutation({
      mutationFn: (id: string) => api(`/admin/users/${id}/unlock`, { method: 'POST' }),
      onSuccess: invalidate,
    }),
    resetPassword: useMutation({
      mutationFn: ({ id, newPassword }: { id: string; newPassword: string }) =>
        api(`/admin/users/${id}/reset-password`, { method: 'POST', body: { newPassword } }),
    }),
  };
}

export function useRoles(enabled = true) {
  return useQuery({
    queryKey: keys.roles,
    queryFn: ({ signal }) => api<Role[]>('/admin/roles', { signal }),
    enabled,
  });
}

export function usePermissionDefs() {
  return useQuery({
    queryKey: keys.permissions,
    queryFn: ({ signal }) => api<PermissionDef[]>('/admin/permissions', { signal }),
    staleTime: Infinity,
  });
}

export function useRoleMutations() {
  const client = useQueryClient();
  const onSuccess = () => client.invalidateQueries({ queryKey: keys.roles });
  return {
    create: useMutation({
      mutationFn: (input: RoleInput) => api<Role>('/admin/roles', { method: 'POST', body: input }),
      onSuccess,
    }),
    update: useMutation({
      mutationFn: ({ id, input }: { id: string; input: RoleInput }) =>
        api<Role>(`/admin/roles/${id}`, { method: 'PUT', body: input }),
      onSuccess,
    }),
    remove: useMutation({
      mutationFn: (id: string) => api(`/admin/roles/${id}`, { method: 'DELETE' }),
      onSuccess,
    }),
  };
}

export function useAuditLogs(query: Record<string, QueryValue>, enabled = true) {
  return useQuery({
    queryKey: [...keys.audit, query],
    queryFn: ({ signal }) => api<PagedResult<AuditLog>>('/admin/audit-logs', { query, signal }),
    placeholderData: keepPreviousData,
    enabled,
  });
}
