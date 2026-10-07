import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { BulkResult, ContentDetail, ContentVersion, Lookups, PagedResult, QueryValue } from '@nb/shared';
import { api } from '@/lib/http';

/**
 * Hook dung chung cho moi module noi dung (projects, products, posts, pages, taxonomies...).
 * Moi resource dung cung bo endpoint: /admin/{resource}[/{id}[/publish|unpublish|...]].
 */
export function contentKeys(resource: string) {
  return {
    all: [resource] as const,
    list: (query: Record<string, QueryValue>) => [resource, 'list', query] as const,
    detail: (id: string) => [resource, 'detail', id] as const,
    versions: (id: string) => [resource, 'versions', id] as const,
  };
}

export function useContentList<TItem>(resource: string, query: Record<string, QueryValue>) {
  return useQuery({
    queryKey: contentKeys(resource).list(query),
    queryFn: ({ signal }) => api<PagedResult<TItem>>(`/admin/${resource}`, { query, signal }),
    placeholderData: keepPreviousData,
  });
}

export function useContentDetail<TData>(resource: string, id: string | undefined) {
  return useQuery({
    queryKey: contentKeys(resource).detail(id ?? ''),
    queryFn: ({ signal }) => api<ContentDetail<TData>>(`/admin/${resource}/${id}`, { signal }),
    enabled: !!id,
  });
}

export function useContentVersions(resource: string, id: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: contentKeys(resource).versions(id ?? ''),
    queryFn: ({ signal }) => api<ContentVersion[]>(`/admin/${resource}/${id}/versions`, { signal }),
    enabled: !!id && enabled,
  });
}

export function useContentMutations<TData>(resource: string) {
  const client = useQueryClient();
  const keys = contentKeys(resource);

  const setDetail = (detail: ContentDetail<TData>) => {
    client.setQueryData(keys.detail(detail.meta.id), detail);
    void client.invalidateQueries({ queryKey: [resource, 'list'] });
    void client.invalidateQueries({ queryKey: keys.versions(detail.meta.id) });
    void client.invalidateQueries({ queryKey: ['lookups'] });
  };
  const invalidateAll = () => {
    void client.invalidateQueries({ queryKey: keys.all });
    void client.invalidateQueries({ queryKey: ['lookups'] });
  };

  const action = (path: string) =>
    useMutation({
      mutationFn: (id: string) => api<ContentDetail<TData>>(`/admin/${resource}/${id}/${path}`, { method: 'POST' }),
      onSuccess: setDetail,
    });

  return {
    create: useMutation({
      mutationFn: (data: TData) => api<ContentDetail<TData>>(`/admin/${resource}`, { method: 'POST', body: data }),
      onSuccess: setDetail,
    }),
    update: useMutation({
      mutationFn: ({ id, data, rowVersion }: { id: string; data: TData; rowVersion?: string }) =>
        api<ContentDetail<TData>>(`/admin/${resource}/${id}`, {
          method: 'PUT',
          body: data,
          headers: rowVersion ? { 'If-Match': `"${rowVersion}"` } : undefined,
        }),
      onSuccess: setDetail,
    }),
    remove: useMutation({
      mutationFn: (id: string) => api(`/admin/${resource}/${id}`, { method: 'DELETE' }),
      onSuccess: invalidateAll,
    }),
    restore: action('restore'),
    publish: action('publish'),
    unpublish: action('unpublish'),
    duplicate: action('duplicate'),
    schedule: useMutation({
      mutationFn: ({ id, publishAt }: { id: string; publishAt: string }) =>
        api<ContentDetail<TData>>(`/admin/${resource}/${id}/schedule`, { method: 'POST', body: { publishAt } }),
      onSuccess: setDetail,
    }),
    bulk: useMutation({
      mutationFn: (input: { action: 'publish' | 'unpublish' | 'delete' | 'restore'; ids: string[] }) =>
        api<BulkResult>(`/admin/${resource}/bulk`, { method: 'POST', body: input }),
      onSuccess: invalidateAll,
    }),
    reorder: useMutation({
      mutationFn: (items: { id: string; sortOrder: number }[]) =>
        api(`/admin/${resource}/reorder`, { method: 'PATCH', body: items }),
      onSuccess: invalidateAll,
    }),
    restoreVersion: useMutation({
      mutationFn: ({ id, versionId }: { id: string; versionId: string }) =>
        api<ContentDetail<TData>>(`/admin/${resource}/${id}/versions/${versionId}/restore`, { method: 'POST' }),
      onSuccess: setDetail,
    }),
    autosave: useMutation({
      mutationFn: ({ id, data }: { id: string; data: TData }) =>
        api<ContentVersion>(`/admin/${resource}/${id}/autosave`, { method: 'PUT', body: data }),
      onSuccess: (_, { id }) => void client.invalidateQueries({ queryKey: keys.versions(id) }),
    }),
  };
}

/** Danh sach rut gon cho o chon (nganh, cong nghe, danh muc...). */
export function useLookups() {
  return useQuery({
    queryKey: ['lookups'],
    queryFn: ({ signal }) => api<Lookups>('/admin/lookups', { signal }),
    staleTime: 60_000,
  });
}
