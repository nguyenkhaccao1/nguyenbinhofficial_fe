import { Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { Controller, useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { ChipSelect, Repeater, StringListInput } from '@/components/form/Inputs';
import { RichTextEditor } from '@/components/form/RichTextEditor';
import { Button, IconButton } from '@/components/ui/Button';
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/Form';
import { useLookups } from '@/lib/content';
import { MediaIdField, MediaPickerDialog } from '@/features/media/MediaPicker';
import { previewUrl, useMediaDetail } from '@/features/media/api';
import type { BlockField } from './blockRegistry';

/**
 * Render form cho du lieu block/section tu dinh nghia trong registry.
 * prefix: duong dan trong form (vd "sections.0.blocks.2.data").
 */
export function BlockFields({ fields, prefix, folder }: { fields: BlockField[]; prefix: string; folder: string }) {
  return (
    <div className="space-y-4">
      {fields.map((f) => <BlockFieldInput key={f.name} field={f} prefix={prefix} folder={folder} />)}
    </div>
  );
}

function BlockFieldInput({ field: f, prefix, folder }: { field: BlockField; prefix: string; folder: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { register, control } = useFormContext<any>();
  const lookups = useLookups();
  const path = `${prefix}.${f.name}`;
  const condition = 'showWhen' in f ? f.showWhen : undefined;
  const conditionValue = useWatch({ control, name: condition ? `${prefix}.${condition.field}` : path });
  if (condition && !condition.values.includes(String(conditionValue ?? ''))) return null;

  switch (f.type) {
    case 'text':
    case 'url':
    case 'number':
      return (
        <Field label={f.label} hint={f.hint}>
          {(a) => <Input {...a} type={f.type === 'number' ? 'number' : f.type === 'url' ? 'url' : 'text'} placeholder={f.placeholder}
            {...register(path, f.type === 'number' ? { setValueAs: (v) => (v === '' || v === null ? null : Number(v)) } : undefined)} />}
        </Field>
      );
    case 'textarea':
    case 'code':
      return (
        <Field label={f.label} hint={f.hint}>
          {(a) => <Textarea {...a} rows={f.type === 'code' ? 8 : 3} className={f.type === 'code' ? 'font-mono text-xs' : undefined}
            placeholder={f.placeholder} {...register(path)} />}
        </Field>
      );
    case 'boolean':
      return <Checkbox label={f.label} {...register(path)} />;
    case 'select':
      return (
        <Field label={f.label}>
          {(a) => <Select {...a} {...register(path)}>{f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</Select>}
        </Field>
      );
    case 'richtext':
      return (
        <div>
          <p className="mb-1.5 text-[13px] font-medium">{f.label}</p>
          <Controller control={control} name={path} render={({ field }) => (
            <RichTextEditor value={field.value as string} onChange={field.onChange} folderPath={folder} minHeight={160} />)} />
        </div>
      );
    case 'media':
      return (
        <Field label={f.label}>
          {() => <Controller control={control} name={path} render={({ field }) => (
            <MediaIdField value={field.value as string | null} onChange={field.onChange} folderPath={folder} kind={f.kind ?? 'IMAGE'} compact />)} />}
        </Field>
      );
    case 'mediaList':
      return (
        <Field label={f.label}>
          {() => <Controller control={control} name={path} render={({ field }) => (
            <MediaListInput value={(field.value as string[] | undefined) ?? []} onChange={field.onChange} folder={folder} />)} />}
        </Field>
      );
    case 'cta':
      return (
        <fieldset>
          <legend className="mb-1.5 text-[13px] font-medium">{f.label}</legend>
          <div className="grid grid-cols-2 gap-2">
            <Input aria-label={`${f.label} — nhãn`} placeholder="Nhãn nút" {...register(`${path}.label`)} />
            <Input aria-label={`${f.label} — liên kết`} placeholder="/lien-he" {...register(`${path}.url`)} />
          </div>
        </fieldset>
      );
    case 'stringList':
      return (
        <Field label={f.label}>
          {() => <Controller control={control} name={path} render={({ field }) => (
            <StringListInput label={f.label} value={(field.value as string[] | undefined) ?? []} onChange={field.onChange} placeholder={f.placeholder} />)} />}
        </Field>
      );
    case 'lookup':
      return (
        <Field label={f.label}>
          {(a) => (
            <Select {...a} {...register(path, { setValueAs: (v) => v || null })}>
              <option value="">— Chọn —</option>
              {(lookups.data?.[f.source] ?? []).map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </Select>
          )}
        </Field>
      );
    case 'lookupMulti':
      return (
        <Field label={f.label}>
          {() => <Controller control={control} name={path} render={({ field }) => (
            <ChipSelect label={f.label} value={(field.value as string[] | undefined) ?? []} onChange={field.onChange}
              options={(lookups.data?.[f.source] ?? []).map((o) => ({ value: o.id, label: o.name }))} />)} />}
        </Field>
      );
    case 'items':
      return <ItemsField field={f} path={path} folder={folder} />;
  }
}

function ItemsField({ field: f, path, folder }: { field: Extract<BlockField, { type: 'items' }>; path: string; folder: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { control, getValues } = useFormContext<any>();
  const items = useFieldArray({ control, name: path });
  return (
    <div>
      <p className="mb-1.5 text-[13px] font-medium">{f.label}</p>
      <Repeater items={items.fields} addLabel={`Thêm ${f.itemLabel}`} max={f.max} emptyText={`Chưa có ${f.itemLabel}.`}
        itemLabel={(_, i) => String(getValues(`${path}.${i}.title`) ?? getValues(`${path}.${i}.label`) ?? '') || `${f.itemLabel} ${i + 1}`}
        onAdd={() => items.append(Object.fromEntries(f.fields.map((x) => [x.name, x.type === 'stringList' ? [] : x.type === 'media' ? null : ''])))}
        onRemove={items.remove} onMove={items.move}
        renderItem={(_, i) => <BlockFields fields={f.fields} prefix={`${path}.${i}`} folder={folder} />} />
    </div>
  );
}

/** Danh sach anh (gallery, logo): them tu thu vien, xoa, doi thu tu bang nut. */
function MediaListInput({ value, onChange, folder }: { value: string[]; onChange: (v: string[]) => void; folder: string }) {
  const [picking, setPicking] = useState(false);
  return (
    <div>
      <ul className="grid grid-cols-3 gap-2">
        {value.map((id, i) => (
          <li key={`${id}-${i}`} className="relative">
            <MediaThumbById id={id} />
            <div className="absolute top-1 right-1 flex gap-0.5">
              {i > 0 && (
                <button type="button" className="rounded bg-white/90 px-1 text-xs shadow" aria-label="Đưa lên trước"
                  onClick={() => onChange(value.map((v, j) => (j === i - 1 ? id : j === i ? value[i - 1]! : v)))}>←</button>
              )}
              <IconButton label="Bỏ ảnh" className="size-6 w-6 bg-white/90" icon={<X className="size-3.5" />}
                onClick={() => onChange(value.filter((_, j) => j !== i))} />
            </div>
          </li>
        ))}
      </ul>
      <Button variant="secondary" size="sm" className="mt-2" icon={<Plus className="size-4" />} onClick={() => setPicking(true)}>Thêm ảnh</Button>
      {value.length > 0 && (
        <Button variant="ghost" size="sm" className="mt-2 ml-1 text-danger" icon={<Trash2 className="size-4" />} onClick={() => onChange([])}>Xoá tất cả</Button>
      )}
      {picking && (
        <MediaPickerDialog folderPath={folder} onClose={() => setPicking(false)} onPick={(m) => {
          onChange([...value, m.id]);
          setPicking(false);
        }} />
      )}
    </div>
  );
}

function MediaThumbById({ id }: { id: string }) {
  const media = useMediaDetail(id).data?.media;
  const url = media ? previewUrl(media, 160) : null;
  return (
    <div className="aspect-[4/3] overflow-hidden rounded border border-border bg-bg-subtle">
      {url && <img src={url} alt={media?.alt ?? ''} className="size-full object-cover" />}
    </div>
  );
}
