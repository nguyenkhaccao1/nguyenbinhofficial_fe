import { Image as ImageIcon, Search, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';
import type { MediaRef } from '@nb/shared';
import { Button, IconButton } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';
import { Input } from '@/components/ui/Form';
import { Pagination } from '@/components/ui/Navigation';
import { useMediaList, type MediaItem } from './api';
import { MediaGrid } from './MediaGrid';
import { useUpload } from './useUpload';

/** O chon anh cho form (logo, OG image...). Gia tri la MediaRef { id } — backend tu dien URL khi doc. */
export function MediaField({ value, onChange, disabled }: {
  value: MediaRef | null;
  onChange: (value: MediaRef | null) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center gap-3">
      <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-md border border-border bg-bg-subtle">
        {value?.url ? <img src={value.url} alt={value.alt ?? ''} className="size-full object-contain" />
          : <ImageIcon className="size-6 text-fg-muted" aria-hidden />}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" disabled={disabled} onClick={() => setOpen(true)}>
          {value ? 'Đổi ảnh' : 'Chọn ảnh'}
        </Button>
        {value && (
          <IconButton label="Bỏ ảnh" disabled={disabled} icon={<X className="size-4" />} onClick={() => onChange(null)} />
        )}
      </div>
      {open && (
        <MediaPickerDialog
          onClose={() => setOpen(false)}
          onPick={(m) => {
            onChange({ id: m.id, url: m.url, alt: m.alt, width: m.width, height: m.height });
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}

export function MediaPickerDialog({ onClose, onPick }: { onClose: () => void; onPick: (media: MediaItem) => void }) {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const media = useMediaList({ q, page, pageSize: 24, kind: 'IMAGE', sort: '-createdAt' });
  const { upload, isUploading } = useUpload();
  const fileInput = useRef<HTMLInputElement>(null);

  return (
    <Dialog open onClose={onClose} size="xl" title="Chọn ảnh từ thư viện">
      <div className="mb-3 flex flex-wrap gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-muted" />
          <Input aria-label="Tìm ảnh" placeholder="Tìm ảnh…" className="h-9 pl-9" value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }} />
        </div>
        <input ref={fileInput} type="file" hidden accept=".jpg,.jpeg,.png,.webp,.avif,.gif" onChange={async (e) => {
          if (!e.target.files?.length) return;
          const [uploaded] = await upload(e.target.files, null);
          e.target.value = '';
          if (uploaded) onPick(uploaded);
        }} />
        <Button variant="secondary" icon={<Upload className="size-4" />} loading={isUploading}
          onClick={() => fileInput.current?.click()}>Tải ảnh mới</Button>
      </div>

      {media.error ? <ErrorState error={media.error} onRetry={() => void media.refetch()} />
        : media.isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="aspect-[4/3.6]" />)}</div>
        ) : media.data?.items.length === 0 ? (
          <EmptyState icon={<ImageIcon />} title="Không có ảnh" description="Tải ảnh mới để sử dụng." />
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
