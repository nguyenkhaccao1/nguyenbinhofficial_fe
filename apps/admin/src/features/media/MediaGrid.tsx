import { FileText, Film, LoaderCircle, TriangleAlert } from 'lucide-react';
import { formatBytes } from '@nb/shared';
import { cn } from '@/lib/cn';
import { previewUrl, type MediaItem } from './api';

export function MediaThumb({ media, className }: { media: MediaItem; className?: string }) {
  const src = previewUrl(media);
  return (
    <div
      className={cn('relative grid aspect-[4/3] place-items-center overflow-hidden bg-bg-subtle', className)}
      style={media.blurDataUrl ? { backgroundImage: `url(${media.blurDataUrl})`, backgroundSize: 'cover' } : undefined}
    >
      {src ? (
        <img src={src} alt={media.alt ?? ''} loading="lazy" decoding="async" className="size-full object-contain" />
      ) : media.kind === 'VIDEO' ? (
        <Film className="size-8 text-fg-muted" aria-hidden />
      ) : (
        <FileText className="size-8 text-fg-muted" aria-hidden />
      )}
      {media.processingState === 'PENDING' && (
        <span className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 rounded bg-white/90 px-1.5 py-0.5 text-[11px]">
          <LoaderCircle className="size-3 animate-spin" /> Đang tối ưu
        </span>
      )}
      {media.processingState === 'FAILED' && (
        <span className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 rounded bg-danger-soft px-1.5 py-0.5 text-[11px] text-danger">
          <TriangleAlert className="size-3" /> Lỗi tối ưu
        </span>
      )}
    </div>
  );
}

interface MediaGridProps {
  items: MediaItem[];
  selectedIds: string[];
  activeId?: string | null;
  onToggleSelect?: (id: string) => void;
  onOpen: (media: MediaItem) => void;
}

export function MediaGrid({ items, selectedIds, activeId, onToggleSelect, onOpen }: MediaGridProps) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
      {items.map((m) => {
        const selected = selectedIds.includes(m.id);
        return (
          <li key={m.id}
            className={cn('group relative overflow-hidden rounded-lg border bg-white transition-shadow hover:shadow-sm',
              selected || activeId === m.id ? 'border-primary ring-2 ring-primary/20' : 'border-border')}>
            <button type="button" onClick={() => onOpen(m)} className="block w-full text-left"
              aria-label={`Mở ${m.fileName}`}>
              <MediaThumb media={m} />
              <div className="border-t border-border px-2.5 py-2">
                <p className="truncate text-[13px] font-medium" title={m.fileName}>{m.fileName}{m.extension}</p>
                <p className="text-xs text-fg-muted">
                  {m.width && m.height ? `${m.width}×${m.height} · ` : ''}{formatBytes(m.sizeBytes)}
                  {m.usageCount > 0 && <span className="text-primary"> · đang dùng</span>}
                </p>
              </div>
            </button>
            {onToggleSelect && (
              <input type="checkbox" aria-label={`Chọn ${m.fileName}`} checked={selected} onChange={() => onToggleSelect(m.id)}
                className={cn('absolute top-2 right-2 size-4 accent-primary',
                  !selected && 'opacity-0 group-focus-within:opacity-100 group-hover:opacity-100')} />
            )}
          </li>
        );
      })}
    </ul>
  );
}
