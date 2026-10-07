import { ArrowDown, ArrowUp, GripVertical, Plus, Trash2 } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import { slugify } from '@nb/shared';
import { Button, IconButton } from '@/components/ui/Button';
import { Input } from '@/components/ui/Form';
import { cn } from '@/lib/cn';

/**
 * Slug tu sinh tu tieu de cho toi khi nguoi dung tu sua slug. Ban ghi da xuat ban: canh bao doi slug
 * lam hong link cu (redirect 301 tu dong se co o Phase SEO).
 */
export function SlugInput({ value, onChange, source, prefix, isPublished, ...props }: {
  value: string | null | undefined;
  onChange: (value: string) => void;
  source: string;
  prefix?: string;
  isPublished?: boolean;
  id?: string;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
}) {
  const touched = useRef(!!value);

  useEffect(() => {
    if (!touched.current) onChange(slugify(source));
  }, [source, onChange]);

  return (
    <div>
      <div className="flex items-stretch overflow-hidden rounded-md border border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
        {prefix && <span className="flex items-center bg-bg-subtle px-3 font-mono text-xs text-fg-muted">{prefix}</span>}
        <input {...props} value={value ?? ''} spellCheck={false}
          className="h-10 min-w-0 flex-1 bg-white px-3 font-mono text-[13px] outline-none"
          onChange={(e) => {
            touched.current = true;
            onChange(e.target.value.toLowerCase().replace(/\s+/g, '-'));
          }}
          onBlur={(e) => onChange(slugify(e.target.value))} />
      </div>
      {isPublished && (
        <p className="mt-1 text-xs text-warning">Đã xuất bản: đổi slug sẽ làm thay đổi đường dẫn đang được chia sẻ/Google index.</p>
      )}
    </div>
  );
}

/** Chon nhieu bang chip (enum, danh muc). */
export function ChipSelect<T extends string>({ options, value, onChange, disabled, label }: {
  options: { value: T; label: string; hint?: string }[];
  value: T[];
  onChange: (value: T[]) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const selected = value.includes(o.value);
        return (
          <button key={o.value} type="button" disabled={disabled} aria-pressed={selected} title={o.hint}
            onClick={() => onChange(selected ? value.filter((v) => v !== o.value) : [...value, o.value])}
            className={cn('rounded-full border px-3 py-1 text-[13px] transition-colors disabled:opacity-50',
              selected ? 'border-primary bg-primary-soft font-medium text-primary' : 'border-border bg-white text-fg/80 hover:border-fg/30')}>
            {o.label}
          </button>
        );
      })}
      {options.length === 0 && <span className="text-[13px] text-fg-muted">Chưa có lựa chọn nào.</span>}
    </div>
  );
}

/**
 * Danh sach lap (tinh nang, media, link, goi gia...): them, xoa, doi thu tu.
 * Thu tu tren danh sach = thu tu hien thi tren website.
 */
export function Repeater<T>({ items, onAdd, onRemove, onMove, renderItem, addLabel, emptyText, max, itemLabel }: {
  items: T[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onMove: (from: number, to: number) => void;
  renderItem: (item: T, index: number) => ReactNode;
  addLabel: string;
  emptyText?: string;
  max?: number;
  itemLabel: (item: T, index: number) => string;
}) {
  return (
    <div className="space-y-2">
      {items.length === 0 && emptyText && (
        <p className="rounded-md border border-dashed border-border px-4 py-6 text-center text-[13px] text-fg-muted">{emptyText}</p>
      )}
      <ol className="space-y-2">
        {items.map((item, index) => (
          <li key={index} className="flex gap-2 rounded-md border border-border bg-white p-3">
            <div className="flex flex-col items-center gap-0.5 pt-1 text-fg-muted">
              <GripVertical className="size-4 opacity-40" aria-hidden />
              <span className="font-mono text-[11px]">{index + 1}</span>
            </div>
            <div className="min-w-0 flex-1">{renderItem(item, index)}</div>
            <div className="flex flex-col gap-0.5">
              <IconButton label={`Đưa "${itemLabel(item, index)}" lên`} disabled={index === 0}
                icon={<ArrowUp className="size-4" />} onClick={() => onMove(index, index - 1)} />
              <IconButton label={`Đưa "${itemLabel(item, index)}" xuống`} disabled={index === items.length - 1}
                icon={<ArrowDown className="size-4" />} onClick={() => onMove(index, index + 1)} />
              <IconButton label={`Xoá "${itemLabel(item, index)}"`} className="text-danger"
                icon={<Trash2 className="size-4" />} onClick={() => onRemove(index)} />
            </div>
          </li>
        ))}
      </ol>
      {(max === undefined || items.length < max) && (
        <Button variant="secondary" size="sm" icon={<Plus className="size-4" />} onClick={onAdd}>{addLabel}</Button>
      )}
    </div>
  );
}

/** Danh sach chuoi (vd cac chuc nang trong 1 module, cac dong trong goi gia). */
export function StringListInput({ value, onChange, placeholder, label }: {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  label: string;
}) {
  return (
    <div className="space-y-1.5">
      {value.map((item, i) => (
        <div key={i} className="flex gap-1.5">
          <Input aria-label={`${label} ${i + 1}`} value={item} placeholder={placeholder} className="h-9"
            onChange={(e) => onChange(value.map((v, j) => (j === i ? e.target.value : v)))} />
          <IconButton label={`Xoá dòng ${i + 1}`} icon={<Trash2 className="size-4" />}
            onClick={() => onChange(value.filter((_, j) => j !== i))} />
        </div>
      ))}
      <Button variant="ghost" size="sm" icon={<Plus className="size-4" />} onClick={() => onChange([...value, ''])}>
        Thêm dòng
      </Button>
    </div>
  );
}
