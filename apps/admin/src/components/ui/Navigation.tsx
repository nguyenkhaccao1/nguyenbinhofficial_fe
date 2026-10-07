import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Button } from './Button';
import { Select } from './Form';

export interface TabItem {
  key: string;
  label: ReactNode;
}

/** Tablist dung chuan WAI-ARIA: mui ten trai/phai chuyen tab. */
export function Tabs({ items, value, onChange, children }: {
  items: TabItem[];
  value: string;
  onChange: (key: string) => void;
  children: ReactNode;
}) {
  const id = useId();
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  const onKeyDown = (event: KeyboardEvent, index: number) => {
    const delta = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!delta) return;
    event.preventDefault();
    const next = items[(index + delta + items.length) % items.length]!;
    onChange(next.key);
    refs.current[next.key]?.focus();
  };

  return (
    <div>
      <div role="tablist" className="flex gap-1 overflow-x-auto overflow-y-hidden border-b border-border">
        {items.map((item, index) => {
          const selected = item.key === value;
          return (
            <button
              key={item.key}
              ref={(el) => {
                refs.current[item.key] = el;
              }}
              role="tab"
              id={`${id}-tab-${item.key}`}
              aria-selected={selected}
              aria-controls={`${id}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(item.key)}
              onKeyDown={(e) => onKeyDown(e, index)}
              className={cn(
                '-mb-px border-b-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors',
                selected ? 'border-primary text-primary' : 'border-transparent text-fg-muted hover:text-fg',
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      <div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-tab-${value}`} className="pt-2">
        {children}
      </div>
    </div>
  );
}

export function Pagination({ page, totalPages, totalItems, pageSize, onPageChange, onPageSizeChange }: {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}) {
  const from = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);
  return (
    <nav aria-label="Phân trang" className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-[13px] text-fg-muted">
      <span>{from}–{to} / {totalItems}</span>
      <div className="flex items-center gap-2">
        {onPageSizeChange && (
          <Select aria-label="Số dòng mỗi trang" className="h-8 w-auto" value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}>
            {[10, 20, 50, 100].map((s) => <option key={s} value={s}>{s}/trang</option>)}
          </Select>
        )}
        <Button variant="secondary" size="sm" aria-label="Trang trước" disabled={page <= 1}
          onClick={() => onPageChange(page - 1)} icon={<ChevronLeft className="size-4" />} />
        <span className="min-w-16 text-center">{page} / {Math.max(totalPages, 1)}</span>
        <Button variant="secondary" size="sm" aria-label="Trang sau" disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)} icon={<ChevronRight className="size-4" />} />
      </div>
    </nav>
  );
}
