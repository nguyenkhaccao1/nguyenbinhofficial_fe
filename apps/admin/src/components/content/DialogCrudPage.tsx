import { Send } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm, useWatch, type Control, type DefaultValues, type FieldValues, type Path, type UseFormRegister } from 'react-hook-form';
import { formatDateTime, type ContentStatus, type Lookups } from '@nb/shared';
import { toast } from 'sonner';
import { usePermission } from '@/auth/session';
import type { DataTableColumn } from '@/components/data-table/DataTable';
import { StringListInput } from '@/components/form/Inputs';
import { Button, IconButton } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { ErrorState, Spinner } from '@/components/ui/Feedback';
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/Form';
import { useContentDetail, useContentMutations, useLookups } from '@/lib/content';
import { applyServerErrors, errorMessage } from '@/lib/forms';
import { MediaIdField } from '@/features/media/MediaPicker';
import { StatusBadge } from './ContentEditor';
import { ContentListPage, TitleCell, type ListFilter } from './ContentListPage';

/** Mo ta 1 truong trong form dialog (danh muc, thu vien). */
export type FieldConfig =
  | { name: string; label: string; type: 'text' | 'textarea' | 'url' | 'number'; required?: boolean; hint?: string; wide?: boolean }
  | { name: string; label: string; type: 'checkbox'; hint?: string }
  | { name: string; label: string; type: 'select'; options: { value: string; label: string }[]; hint?: string; nullable?: boolean }
  | {
      name: string; label: string; type: 'lookup'; source: keyof Lookups; hint?: string; excludeSelf?: boolean;
      /** Nguon phu thuoc gia tri truong khac (vd FAQ: pham vi SERVICE → danh sach dich vu). Khong khop → an truong. */
      dependsOn?: { field: string; sources: Record<string, keyof Lookups> };
    }
  | { name: string; label: string; type: 'media'; folder: string; hint?: string }
  | { name: string; label: string; type: 'links'; hint?: string }
  | { name: string; label: string; type: 'seo' };

export interface DialogCrudConfig<T extends FieldValues> {
  resource: string;
  permission: string;
  title: string;
  label: string;
  description?: string;
  fields: FieldConfig[];
  empty: T;
  /** Danh muc mac dinh Published, khong can quy trinh xuat ban. */
  publishable?: boolean;
  titleField: keyof T & string;
  subtitle?: (row: Record<string, unknown>) => string | null | undefined;
  filters?: ListFilter[];
  extraColumns?: DataTableColumn<Row>[];
  defaultSort?: string;
}

type Row = { id: string; status: ContentStatus; updatedAt: string | null } & Record<string, unknown>;

/** Trang danh sach + form dialog cho noi dung it truong (danh muc, testimonial, doi tac, FAQ...). */
export function DialogCrudPage<T extends FieldValues>({ config }: { config: DialogCrudConfig<T> }) {
  const [editing, setEditing] = useState<string | 'new' | null>(null);
  const m = useContentMutations(config.resource);
  const canPublish = usePermission(`${config.permission}.publish`);

  return (
    <>
      <ContentListPage<Row>
        resource={config.resource}
        permission={config.permission}
        title={config.title}
        label={config.label}
        description={config.description}
        defaultSort={config.defaultSort ?? 'sortOrder,name'}
        publishable={config.publishable !== false}
        filters={config.filters}
        onCreate={() => setEditing('new')}
        onEdit={(row) => setEditing(row.id)}
        extraActions={(row) => config.publishable !== false && canPublish && row.status !== 'PUBLISHED' && (
          <IconButton label="Xuất bản" icon={<Send className="size-4" />} onClick={async () => {
            try {
              await m.publish.mutateAsync(row.id);
              toast.success('Đã xuất bản.');
            } catch (error) {
              toast.error(errorMessage(error));
            }
          }} />
        )}
        columns={[
          {
            id: 'title', header: 'Tên', sortKey: config.titleField === 'name' ? 'name' : 'title', alwaysVisible: true,
            cell: (r) => (
              <button type="button" className="text-left" onClick={() => setEditing(r.id)}>
                <TitleCell title={String(r[config.titleField] ?? r.title ?? r.name ?? '')}
                  subtitle={config.subtitle?.(r) ?? (typeof r.slug === 'string' ? r.slug : (r.subtitle as string | null))} />
              </button>
            ),
          },
          ...(config.extraColumns ?? []),
          ...(config.publishable !== false
            ? [{ id: 'status', header: 'Trạng thái', cell: (r: Row) => <StatusBadge status={r.status} /> }]
            : []),
          { id: 'sortOrder', header: 'Thứ tự', sortKey: 'sortOrder', cell: (r) => (r.sortOrder as number | undefined) ?? '—' },
          { id: 'updated', header: 'Cập nhật', sortKey: 'updatedAt', defaultHidden: true, cell: (r) => formatDateTime(r.updatedAt) },
        ]}
      />
      {editing && <EditDialog config={config} id={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />}
    </>
  );
}

function EditDialog<T extends FieldValues>({ config, id, onClose }: { config: DialogCrudConfig<T>; id?: string; onClose: () => void }) {
  const detail = useContentDetail<T>(config.resource, id);
  if (id && !detail.data) {
    return (
      <Dialog open onClose={onClose} title={`Sửa ${config.label}`}>
        {detail.error ? <ErrorState error={detail.error} onRetry={() => void detail.refetch()} />
          : <div className="grid place-items-center py-10"><Spinner /></div>}
      </Dialog>
    );
  }
  return <EditForm config={config} id={id} initial={detail.data ? { ...config.empty, ...detail.data.data } : config.empty}
    rowVersion={detail.data?.meta.rowVersion} onClose={onClose} />;
}

function EditForm<T extends FieldValues>({ config, id, initial, rowVersion, onClose }: {
  config: DialogCrudConfig<T>; id?: string; initial: T; rowVersion?: string; onClose: () => void;
}) {
  const { create, update } = useContentMutations<T>(config.resource);
  const lookups = useLookups();
  const canEdit = usePermission(`${config.permission}.${id ? 'update' : 'create'}`);
  const { register, control, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<T>({
    defaultValues: initial as DefaultValues<T>,
  });
  const e = errors as Record<string, { message?: string } | undefined>;

  const onSubmit = handleSubmit(async (data) => {
    try {
      if (id) await update.mutateAsync({ id, data, rowVersion });
      else await create.mutateAsync(data);
      toast.success(id ? 'Đã lưu.' : `Đã tạo ${config.label}.`);
      onClose();
    } catch (error) {
      applyServerErrors(error, setError);
    }
  });

  const name = (n: string) => n as Path<T>;

  return (
    <Dialog open onClose={onClose} size="lg" title={id ? `Sửa ${config.label}` : `Thêm ${config.label}`}
      footer={<>
        <Button variant="secondary" onClick={onClose}>Huỷ</Button>
        {canEdit && <Button type="submit" form="dialog-crud-form" loading={isSubmitting}>{id ? 'Lưu' : 'Tạo'}</Button>}
      </>}>
      <form id="dialog-crud-form" onSubmit={onSubmit} noValidate>
        <fieldset disabled={!canEdit} className="grid gap-4 sm:grid-cols-2">
          {config.fields.map((f) => {
            const error = e[f.name]?.message;
            switch (f.type) {
              case 'checkbox':
                return <Checkbox key={f.name} className="sm:col-span-2" label={f.label} {...register(name(f.name))} />;
              case 'select':
                return (
                  <Field key={f.name} label={f.label} error={error} hint={f.hint}>
                    {(a) => (
                      <Select {...a} {...register(name(f.name), f.nullable ? { setValueAs: (v) => v || null } : undefined)}>
                        {f.nullable && <option value="">— Không —</option>}
                        {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </Select>
                    )}
                  </Field>
                );
              case 'lookup':
                return (
                  <LookupField key={f.name} field={f} control={control} register={register} error={error}
                    selfId={id} lookups={lookups.data} />
                );
              case 'media':
                return (
                  <Field key={f.name} label={f.label} error={error} hint={f.hint}>
                    {() => <Controller control={control} name={name(f.name)} render={({ field }) => (
                      <MediaIdField value={field.value as string | null} onChange={field.onChange} folderPath={f.folder} compact />
                    )} />}
                  </Field>
                );
              case 'links':
                return (
                  <Field key={f.name} label={f.label} error={error} hint={f.hint} className="sm:col-span-2">
                    {() => <Controller control={control} name={name(f.name)} render={({ field }) => (
                      <StringListInput label={f.label} value={(field.value as string[] | undefined) ?? []} onChange={field.onChange} placeholder="https://" />
                    )} />}
                  </Field>
                );
              case 'seo':
                return (
                  <details key={f.name} className="rounded-md border border-border p-3 sm:col-span-2">
                    <summary className="cursor-pointer text-[13px] font-medium">{f.label}</summary>
                    <div className="mt-3 grid gap-3">
                      <Field label="Tiêu đề SEO" error={(errors as Record<string, Record<string, { message?: string }>>).seo?.title?.message}>
                        {(a) => <Input {...a} {...register(name('seo.title'))} />}
                      </Field>
                      <Field label="Mô tả SEO" error={(errors as Record<string, Record<string, { message?: string }>>).seo?.description?.message}>
                        {(a) => <Textarea rows={2} {...a} {...register(name('seo.description'))} />}
                      </Field>
                    </div>
                  </details>
                );
              default:
                return (
                  <Field key={f.name} label={f.label} error={error} hint={f.hint} required={f.required}
                    className={f.type === 'textarea' || f.wide ? 'sm:col-span-2' : undefined}>
                    {(a) => f.type === 'textarea'
                      ? <Textarea rows={3} {...a} {...register(name(f.name))} />
                      : <Input {...a} type={f.type === 'number' ? 'number' : f.type === 'url' ? 'url' : 'text'}
                          {...register(name(f.name), {
                            ...(f.type === 'number' ? { valueAsNumber: true } : {}),
                            ...(f.required ? { validate: (v: unknown) => String(v ?? '').trim() !== '' || `Vui lòng nhập ${f.label.toLowerCase()}.` } : {}),
                          })} />}
                  </Field>
                );
            }
          })}
        </fieldset>
      </form>
    </Dialog>
  );
}

function LookupField<T extends FieldValues>({ field: f, control, register, error, selfId, lookups }: {
  field: Extract<FieldConfig, { type: 'lookup' }>;
  control: Control<T>;
  register: UseFormRegister<T>;
  error?: string;
  selfId?: string;
  lookups?: Lookups;
}) {
  const dependency = useWatch({ control, name: (f.dependsOn?.field ?? f.name) as Path<T> }) as string | undefined;
  const source = f.dependsOn ? f.dependsOn.sources[dependency ?? ''] : f.source;
  if (!source) return null;

  return (
    <Field label={f.label} error={error} hint={f.hint}>
      {(a) => (
        <Select {...a} {...register(f.name as Path<T>, { setValueAs: (v) => v || null })}>
          <option value="">— Không —</option>
          {(lookups?.[source] ?? []).filter((o) => !f.excludeSelf || o.id !== selfId)
            .map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </Select>
      )}
    </Field>
  );
}
