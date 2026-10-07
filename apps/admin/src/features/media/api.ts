import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PagedResult, QueryValue } from '@nb/shared';
import { api } from '@/lib/http';

export type MediaKind = 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'OTHER';

export interface MediaVariant {
  format: 'webp' | 'avif' | string;
  width: number;
  height: number;
  url: string;
  sizeBytes: number;
}

export interface MediaItem {
  id: string;
  folderId: string | null;
  fileName: string;
  originalName: string;
  url: string | null;
  mimeType: string;
  extension: string;
  kind: MediaKind;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  title: string | null;
  alt: string | null;
  caption: string | null;
  tags: string[];
  variants: MediaVariant[];
  processingState: 'NONE' | 'PENDING' | 'DONE' | 'FAILED';
  blurDataUrl: string | null;
  isPrivate: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string | null;
}

export interface MediaUsage {
  entityType: string;
  entityId: string;
  field: string;
}

export interface MediaFolder {
  id: string;
  name: string;
  parentId: string | null;
  fileCount: number;
}

export interface UploadResult {
  fileName: string;
  success: boolean;
  media: MediaItem | null;
  error: string | null;
}

export interface UpdateMediaInput {
  fileName: string;
  title: string | null;
  alt: string | null;
  caption: string | null;
  tags: string[];
  folderId: string | null;
}

/** Gioi han giong backend (UploadPolicy) de bao loi som, backend van kiem tra lai. */
export const ACCEPTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.mp4', '.webm', '.pdf', '.doc',
  '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.zip', '.csv', '.txt'];

const keys = {
  media: ['media'] as const,
  folders: ['media', 'folders'] as const,
};

export function useMediaList(query: Record<string, QueryValue>) {
  return useQuery({
    queryKey: [...keys.media, 'list', query],
    queryFn: ({ signal }) => api<PagedResult<MediaItem>>('/admin/media', { query, signal }),
    placeholderData: keepPreviousData,
    // Anh moi upload dang tao bien the → tu lam moi cho toi khi xong.
    refetchInterval: (q) => (q.state.data?.items.some((m) => m.processingState === 'PENDING') ? 3000 : false),
  });
}

export function useMediaDetail(id: string | null) {
  return useQuery({
    queryKey: [...keys.media, 'detail', id],
    queryFn: ({ signal }) => api<{ media: MediaItem; usages: MediaUsage[] }>(`/admin/media/${id}`, { signal }),
    enabled: !!id,
  });
}

export function useMediaFolders() {
  return useQuery({
    queryKey: keys.folders,
    queryFn: ({ signal }) => api<MediaFolder[]>('/admin/media/folders', { signal }),
  });
}

export function useMediaMutations() {
  const client = useQueryClient();
  const invalidate = () => client.invalidateQueries({ queryKey: keys.media });

  return {
    upload: useMutation({
      mutationFn: ({ files, folderId, folderPath }: { files: File[]; folderId: string | null; folderPath?: string }) => {
        const form = new FormData();
        for (const file of files) form.append('files', file);
        if (folderId) form.append('folderId', folderId);
        else if (folderPath) form.append('folderPath', folderPath);
        return api<UploadResult[]>('/admin/media/upload', { method: 'POST', body: form });
      },
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, input }: { id: string; input: UpdateMediaInput }) =>
        api<MediaItem>(`/admin/media/${id}`, { method: 'PUT', body: input }),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: ({ id, force }: { id: string; force?: boolean }) =>
        api(`/admin/media/${id}`, { method: 'DELETE', query: { force } }),
      onSuccess: invalidate,
    }),
    bulk: useMutation({
      mutationFn: (input: { action: 'delete' | 'move'; ids: string[]; folderId?: string | null; force?: boolean }) =>
        api('/admin/media/bulk', { method: 'POST', body: input }),
      onSuccess: invalidate,
    }),
    createFolder: useMutation({
      mutationFn: (input: { name: string; parentId: string | null }) =>
        api<MediaFolder>('/admin/media/folders', { method: 'POST', body: input }),
      onSuccess: invalidate,
    }),
    updateFolder: useMutation({
      mutationFn: ({ id, ...input }: { id: string; name: string; parentId: string | null }) =>
        api<MediaFolder>(`/admin/media/folders/${id}`, { method: 'PUT', body: input }),
      onSuccess: invalidate,
    }),
    deleteFolder: useMutation({
      mutationFn: (id: string) => api(`/admin/media/folders/${id}`, { method: 'DELETE' }),
      onSuccess: invalidate,
    }),
  };
}

/** Anh nho nhat >= width (uu tien webp de preview nhanh trong admin). */
export function previewUrl(media: MediaItem, width = 320): string | null {
  if (media.kind !== 'IMAGE') return null;
  const webp = media.variants.filter((v) => v.format === 'webp').sort((a, b) => a.width - b.width);
  return (webp.find((v) => v.width >= width) ?? webp.at(-1))?.url ?? media.url;
}
