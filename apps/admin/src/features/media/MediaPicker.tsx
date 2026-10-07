import { FileText, Image as ImageIcon, Search, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';
import type { MediaRef } from '@nb/shared';
import { Button, IconButton } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';
import { Input, Select } from '@/components/ui/Form';
import { Pagination } from '@/components/ui/Navigation';
import { previewUrl, useMediaDetail, useMediaList, type MediaItem, type MediaKind } from './api';
import { MediaGrid } from './MediaGrid';
import { useUpload } from './useUpload';

const IMAGE_ACCEPT = '.jpg,.jpeg,.png,.webp,.avif,.gif';

/** O chon anh cho settings — gia tri la MediaRef { id } (backend tu dien URL khi doc). */
export function MediaField({ value, onChange, disabled, folderPath }: {
  value: MediaRef | null;
  onChange: (value: MediaRef | null) => void;
  disabled?: boolean;
  folderPath?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex items-center gap-3">
      <Thumb url={value?.url ?? null} alt={value?.alt ?? ''} />
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" disabled={disabled} onClick={() => setOpen(true)}>
          {value ? 'Đổi ảnh' : 'Chọn ảnh'}
        </Button>
        {value && <IconButton label="Bỏ ảnh" disabled={disabled} icon={<X className="size-4" />} onClick={() => onChange(null)} />}
      </div>
      {open && (
        <MediaPickerDialog folderPath={folderPath} onClose={() => setOpen(false)}
          onPick={(m) => {
            onChange({ id: m.id, url: m.url, alt: m.alt, width: m.width, height: m.height });
            setOpen(false);
          }} />
      )}
    </div>
  );
}

/**
 * O chon media cho form noi dung — gia tri la id. folderPath quyet dinh anh moi tai len nam o nhanh nao
 * trong cay thu muc (vd "Dự án/PerfectKey Workforce").
 */
export function MediaIdField({ value, onChange, disabled, folderPath, kind = 'IMAGE', compact }: {
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  disabled?: boolean;
  folderPath?: string;
  kind?: MediaKind | 'ANY';
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const detail = useMediaDetail(value ?? null);
  const media = detail.data?.media;

  return (
    <div className="flex items-center gap-3">
      {media && media.kind !== 'IMAGE' ? (
        <div className="grid size-16 shrink-0 place-items-center rounded-md border border-border bg-bg-subtle">
          <FileText className="size-5 text-fg-muted" aria-hidden />
        </div>
      ) : (
        <Thumb url={media ? previewUrl(media, 160) : null} alt={media?.alt ?? ''} small={compact} loading={!!value && detail.isLoading} />
      )}
      <div className="min-w-0">
        {media && <p className="truncate text-[13px] font-medium" title={media.fileName}>{media.fileName}{media.extension}</p>}
        {value && detail.error ? <p className="text-xs text-danger">File không còn tồn tại.</p> : null}
        <div className="mt-1 flex flex-wrap gap-1.5">
          <Button variant="secondary" size="sm" disabled={disabled} onClick={() => setOpen(true)}>
            {value ? 'Đổi' : kind === 'IMAGE' ? 'Chọn ảnh' : 'Chọn file'}
          </Button>
          {value && <IconButton label="Bỏ chọn" disabled={disabled} icon={<X className="size-4" />} onClick={() => onChange(null)} />}
        </div>
      </div>
      {open && (
        <MediaPickerDialog folderPath={folderPath} kind={kind} onClose={() => setOpen(false)}
          onPick={(m) => {
            onChange(m.id);
            setOpen(false);
          }} />
      )}
    </div>
  );
}

function Thumb({ url, alt, small, loading }: { url: string | null; alt: string; small?: boolean; loading?: boolean }) {
  const size = small ? 'size-14' : 'size-20';
  if (loading) return <Skeleton className={`${size} shrink-0`} />;
  return (
    <div className={`${size} grid shrink-0 place-items-center overflow-hidden rounded-md border border-border bg-bg-subtle`}>
      {url ? <img src={url} alt={alt} className="size-full object-contain" /> : <ImageIcon className="size-6 text-fg-muted" aria-hidden />}
    </div>
  );
}

export function MediaPickerDialog({ onClose, onPick, folderPath, kind = 'IMAGE' }: {
  onClose: () => void;
  onPick: (media: MediaItem) => void;
  folderPath?: string;
  kind?: MediaKind | 'ANY';
}) {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [kindFilter, setKindFilter] = useState<string>(kind === 'ANY' ? '' : kind);
  const media = useMediaList({ q, page, pageSize: 24, kind: kindFilter || undefined, sort: '-createdAt' });
  const { upload, isUploading } = useUpload();
  const fileInput = useRef<HTMLInputElement>(null);

  return (
    <Dialog open onClose={onClose} size="xl" title="Chọn từ thư viện media"
      description={folderPath ? `File tải lên mới sẽ được lưu vào thư mục: ${folderPath}` : undefined}>
      <div className="mb-3 flex flex-wrap gap-2">
        <div className="relative min-w-48 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-muted" />
          <Input aria-label="Tìm media" placeholder="Tìm theo tên, alt…" className="h-9 pl-9" value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }} />
        </div>
        {kind === 'ANY' && (
          <Select aria-label="Loại" className="h-9 w-auto" value={kindFilter} onChange={(e) => setKindFilter(e.target.value)}>
            <option value="">Mọi loại</option>
            <option value="IMAGE">Hình ảnh</option>
            <option value="VIDEO">Video</option>
            <option value="DOCUMENT">Tài liệu</option>
          </Select>
        )}
        <input ref={fileInput} type="file" hidden accept={kind === 'IMAGE' ? IMAGE_ACCEPT : undefined} onChange={async (e) => {
          if (!e.target.files?.length) return;
          const [uploaded] = await upload(e.target.files, null, folderPath);
          e.target.value = '';
          if (uploaded) onPick(uploaded);
        }} />
        <Button variant="secondary" icon={<Upload className="size-4" />} loading={isUploading}
          onClick={() => fileInput.current?.click()}>Tải file mới</Button>
      </div>

      {media.error ? <ErrorState error={media.error} onRetry={() => void media.refetch()} />
        : media.isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="aspect-[4/3.6]" />)}</div>
        ) : media.data?.items.length === 0 ? (
          <EmptyState icon={<ImageIcon />} title="Không có file phù hợp" description="Tải file mới để sử dụng." />
        ) : (
          <>
            <MediaGrid items={media.data?.items ?? []} selectedIds={[]} onOpen={onPick} />
            {media.data && media.data.totalPages > 1 && (
              <Pagination page={media.data.page} pageSize={media.data.pageSize} totalPages={media.data.totalPages}
                totalItems={media.data.totalItems} onPageChange={setPage} />
            )}
          </>
        )}
    </Dialog>
  );
}
