import { Copy, ExternalLink, Trash2, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { ApiError, formatBytes, formatDateTime, Permissions } from '@nb/shared';
import { toast } from 'sonner';
import { usePermission } from '@/auth/session';
import { Button, IconButton } from '@/components/ui/Button';
import { useConfirm } from '@/components/ui/Dialog';
import { ErrorState, Spinner } from '@/components/ui/Feedback';
import { Field, Input, Select, Textarea } from '@/components/ui/Form';
import { applyServerErrors, errorMessage } from '@/lib/forms';
import { useMediaDetail, useMediaMutations, type MediaFolder, type MediaItem, type MediaUsage } from './api';
import { MediaThumb } from './MediaGrid';

interface Values {
  fileName: string;
  title: string;
  alt: string;
  caption: string;
  tags: string;
  folderId: string;
}

const usageLabels: Record<string, string> = { SETTINGS: 'Cấu hình website' };

export function describeUsage(u: MediaUsage) {
  return `${usageLabels[u.entityType] ?? u.entityType} · ${u.entityId} · ${u.field}`;
}

export function MediaDetailPanel({ id, folders, onClose }: { id: string; folders: MediaFolder[]; onClose: () => void }) {
  const detail = useMediaDetail(id);

  return (
    <aside aria-label="Chi tiết media" className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-white">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="font-semibold">Chi tiết</h2>
        <IconButton label="Đóng chi tiết" icon={<X className="size-4" />} onClick={onClose} />
      </div>
      {detail.error ? <ErrorState error={detail.error} onRetry={() => void detail.refetch()} />
        : !detail.data ? <div className="grid flex-1 place-items-center"><Spinner /></div>
        : <DetailBody key={detail.data.media.id + (detail.data.media.updatedAt ?? '')} media={detail.data.media}
            usages={detail.data.usages} folders={folders} onDeleted={onClose} />}
    </aside>
  );
}

function DetailBody({ media, usages, folders, onDeleted }: {
  media: MediaItem; usages: MediaUsage[]; folders: MediaFolder[]; onDeleted: () => void;
}) {
  const { update, remove } = useMediaMutations();
  const confirm = useConfirm();
  const canEdit = usePermission(Permissions.media.update);
  const canDelete = usePermission(Permissions.media.delete);
  const absoluteUrl = media.url ? new URL(media.url, window.location.origin).toString() : null;

  const { register, handleSubmit, setError, formState: { errors, isSubmitting, isDirty } } = useForm<Values>({
    defaultValues: {
      fileName: media.fileName,
      title: media.title ?? '',
      alt: media.alt ?? '',
      caption: media.caption ?? '',
      tags: media.tags.join(', '),
      folderId: media.folderId ?? '',
    },
  });

  const onSubmit = handleSubmit(async (v) => {
    try {
      await update.mutateAsync({
        id: media.id,
        input: {
          fileName: v.fileName.trim(),
          title: v.title.trim() || null,
          alt: v.alt.trim() || null,
          caption: v.caption.trim() || null,
          tags: v.tags.split(',').map((t) => t.trim()).filter(Boolean),
          folderId: v.folderId || null,
        },
      });
      toast.success('Đã lưu.');
    } catch (error) {
      applyServerErrors(error, setError);
    }
  });

  const onDelete = async () => {
    if (!(await confirm({ title: `Xoá ${media.fileName}?`, confirmLabel: 'Xoá' }))) return;
    try {
      await remove.mutateAsync({ id: media.id });
      toast.success('Đã xoá.');
      onDeleted();
    } catch (error) {
      // 409: dang duoc dung → hien noi dung va hoi lai truoc khi xoa han.
      if (error instanceof ApiError && error.status === 409) {
        const list = (error.data as { usages?: MediaUsage[] } | null)?.usages ?? [];
        const force = await confirm({
          title: 'Media đang được sử dụng',
          description: (
            <div className="space-y-2">
              <p>{error.message}</p>
              <ul className="list-disc pl-5 text-[13px]">{list.map((u, i) => <li key={i}>{describeUsage(u)}</li>)}</ul>
              <p>Xoá sẽ làm các vị trí trên mất hình ảnh.</p>
            </div>
          ),
          confirmLabel: 'Vẫn xoá',
        });
        if (!force) return;
        try {
          await remove.mutateAsync({ id: media.id, force: true });
          toast.success('Đã xoá.');
          onDeleted();
        } catch (e) {
          toast.error(errorMessage(e));
        }
      } else {
        toast.error(errorMessage(error));
      }
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <MediaThumb media={media} className="aspect-video border-b border-border" />

      <div className="space-y-4 p-4">
        <dl className="grid grid-cols-[96px_1fr] gap-y-1 text-[13px]">
          <dt className="text-fg-muted">Định dạng</dt><dd>{media.mimeType}</dd>
          <dt className="text-fg-muted">Dung lượng</dt><dd>{formatBytes(media.sizeBytes)}</dd>
          {media.width && <><dt className="text-fg-muted">Kích thước</dt><dd>{media.width} × {media.height}px</dd></>}
          <dt className="text-fg-muted">Tải lên</dt><dd>{formatDateTime(media.createdAt)}</dd>
          <dt className="text-fg-muted">Tên gốc</dt><dd className="break-all">{media.originalName}</dd>
        </dl>

        {absoluteUrl && (
          <div className="flex gap-2">
            <Input readOnly value={absoluteUrl} aria-label="URL" className="h-8 font-mono text-xs" onFocus={(e) => e.target.select()} />
            <IconButton label="Sao chép URL" icon={<Copy className="size-4" />}
              onClick={() => navigator.clipboard.writeText(absoluteUrl).then(() => toast.success('Đã sao chép URL.'))} />
            <a href={absoluteUrl} target="_blank" rel="noreferrer" aria-label="Mở file"
              className="grid size-8 shrink-0 place-items-center rounded-md hover:bg-bg-subtle">
              <ExternalLink className="size-4" />
            </a>
          </div>
        )}

        {media.variants.length > 0 && (
          <details className="text-[13px]">
            <summary className="cursor-pointer text-fg-muted">{media.variants.length} biến thể tối ưu (WebP/AVIF)</summary>
            <ul className="mt-2 space-y-0.5 font-mono text-xs">
              {media.variants.map((v) => (
                <li key={v.url}>{v.format.toUpperCase()} {v.width}w — {formatBytes(v.sizeBytes)}</li>
              ))}
            </ul>
          </details>
        )}

        <form onSubmit={onSubmit} noValidate className="space-y-3 border-t border-border pt-4">
          <fieldset disabled={!canEdit} className="space-y-3">
            <Field label="Tên hiển thị" error={errors.fileName?.message} required>
              {(p) => <Input {...p} {...register('fileName', { required: 'Vui lòng nhập tên file.' })} />}
            </Field>
            {media.kind === 'IMAGE' && (
              <Field label="Alt (mô tả ảnh)" error={errors.alt?.message}
                hint="Mô tả nội dung ảnh cho người dùng trình đọc màn hình và SEO.">
                {(p) => <Input {...p} {...register('alt')} />}
              </Field>
            )}
            <Field label="Tiêu đề" error={errors.title?.message}>{(p) => <Input {...p} {...register('title')} />}</Field>
            <Field label="Chú thích" error={errors.caption?.message}>{(p) => <Textarea rows={2} {...p} {...register('caption')} />}</Field>
            <Field label="Tag" hint="Phân cách bằng dấu phẩy." error={errors.tags?.message}>
              {(p) => <Input {...p} {...register('tags')} />}
            </Field>
            <Field label="Thư mục" error={errors.folderId?.message}>
              {(p) => (
                <Select {...p} {...register('folderId')}>
                  <option value="">(Thư mục gốc)</option>
                  {folders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                </Select>
              )}
            </Field>
          </fieldset>
          {canEdit && <Button type="submit" size="sm" loading={isSubmitting} disabled={!isDirty}>Lưu thay đổi</Button>}
        </form>

        <div className="border-t border-border pt-4">
          <h3 className="mb-2 text-[13px] font-semibold">Đang được sử dụng ({usages.length})</h3>
          {usages.length === 0 ? <p className="text-[13px] text-fg-muted">Chưa được dùng ở đâu.</p> : (
            <ul className="space-y-1 text-[13px]">{usages.map((u, i) => <li key={i}>{describeUsage(u)}</li>)}</ul>
          )}
        </div>

        {canDelete && (
          <Button variant="secondary" size="sm" className="text-danger" icon={<Trash2 className="size-4" />} onClick={onDelete}>
            Xoá file
          </Button>
        )}
      </div>
    </div>
  );
}
