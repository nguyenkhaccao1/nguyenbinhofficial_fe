import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useFieldArray, useForm, useFormContext, FormProvider } from 'react-hook-form';
import { Permissions } from '@nb/shared';
import { toast } from 'sonner';
import { usePermission } from '@/auth/session';
import { Repeater } from '@/components/form/Inputs';
import { Button } from '@/components/ui/Button';
import { Card, ErrorState, PageHeader, Skeleton } from '@/components/ui/Feedback';
import { Checkbox, Input, Select } from '@/components/ui/Form';
import { Tabs } from '@/components/ui/Navigation';
import { applyServerErrors } from '@/lib/forms';
import { api } from '@/lib/http';

interface MenuItemInput {
  label: string;
  url: string | null;
  description: string | null;
  openInNewTab: boolean;
  dynamicSource: string | null;
  isEnabled: boolean;
  children: MenuItemInput[];
}

interface MenuDto {
  id: string;
  code: string;
  name: string;
  items: MenuItemInput[];
  updatedAt: string | null;
}

const sourceLabels: Record<string, string> = {
  PRODUCTS: 'Megamenu: Sản phẩm (tự lấy từ CMS)',
  SERVICES: 'Megamenu: Dịch vụ (tự lấy từ CMS)',
  SOLUTIONS: 'Megamenu: Giải pháp theo ngành',
  PROJECTS: 'Megamenu: Dự án nổi bật',
};

const blank = (): MenuItemInput => ({ label: '', url: '', description: null, openInNewTab: false, dynamicSource: null, isEnabled: true, children: [] });

export function MenusPage() {
  const menus = useQuery({ queryKey: ['menus'], queryFn: ({ signal }) => api<MenuDto[]>('/admin/menus', { signal }) });
  const [code, setCode] = useState('header');

  return (
    <>
      <PageHeader title="Menu & Footer" description="Menu header (megamenu Sản phẩm/Giải pháp/Dịch vụ tự lấy dữ liệu từ CMS) và các cột footer." />
      <Card className="px-4 pb-4 lg:px-6">
        {menus.error ? <ErrorState error={menus.error} onRetry={() => void menus.refetch()} />
          : !menus.data ? <div className="space-y-3 py-6"><Skeleton className="h-10" /><Skeleton className="h-40" /></div> : (
            <Tabs value={code} onChange={setCode} items={menus.data.map((m) => ({ key: m.code, label: m.name }))}>
              {menus.data.filter((m) => m.code === code).map((m) => <MenuForm key={`${m.code}-${m.updatedAt}`} menu={m} />)}
            </Tabs>
          )}
      </Card>
    </>
  );
}

function MenuForm({ menu }: { menu: MenuDto }) {
  const canEdit = usePermission(Permissions.menu.update);
  const client = useQueryClient();
  const form = useForm<{ name: string; items: MenuItemInput[] }>({ defaultValues: { name: menu.name, items: menu.items } });
  const items = useFieldArray({ control: form.control, name: 'items' });
  const save = useMutation({
    mutationFn: (data: { name: string; items: MenuItemInput[] }) => api<MenuDto>(`/admin/menus/${menu.code}`, { method: 'PUT', body: data }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['menus'] }),
  });
  useEffect(() => form.reset({ name: menu.name, items: menu.items }), [menu, form]);

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      await save.mutateAsync(data);
      toast.success('Đã lưu menu.');
    } catch (error) {
      applyServerErrors(error, form.setError);
    }
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} noValidate className="pt-4">
        <fieldset disabled={!canEdit} className="space-y-4">
          <Input aria-label="Tên menu" className="max-w-sm" {...form.register('name')} />
          <Repeater items={items.fields} addLabel="Thêm mục" emptyText="Menu trống." max={30}
            itemLabel={(_, i) => form.getValues(`items.${i}.label`) || `Mục ${i + 1}`}
            onAdd={() => items.append(blank())} onRemove={items.remove} onMove={items.move}
            renderItem={(_, i) => <ItemFields prefix={`items.${i}`} allowChildren />} />
        </fieldset>
        {canEdit && (
          <div className="mt-5 flex gap-2 border-t border-border pt-4">
            <Button type="submit" loading={form.formState.isSubmitting} disabled={!form.formState.isDirty}>Lưu menu</Button>
            <Button variant="ghost" disabled={!form.formState.isDirty} onClick={() => form.reset()}>Huỷ thay đổi</Button>
          </div>
        )}
      </form>
    </FormProvider>
  );
}

function ItemFields({ prefix, allowChildren }: { prefix: string; allowChildren?: boolean }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { register, control, getValues, formState: { errors } } = useFormContext<any>();
  const children = useFieldArray({ control, name: `${prefix}.children` });
  const error = (field: string) => prefix.split('.').concat(field).reduce<unknown>((o, k) => (o as Record<string, unknown> | undefined)?.[k], errors) as { message?: string } | undefined;

  return (
    <div className="space-y-2">
      <div className="grid gap-2 sm:grid-cols-[1fr_1.4fr]">
        <Input aria-label="Nhãn" placeholder="Nhãn" aria-invalid={!!error('label')} {...register(`${prefix}.label`)} />
        <Input aria-label="Đường dẫn" placeholder="/duong-dan hoặc https://" className="font-mono text-[13px]" aria-invalid={!!error('url')} {...register(`${prefix}.url`)} />
      </div>
      {(error('label') ?? error('url')) && <p className="text-[13px] text-danger">{error('label')?.message ?? error('url')?.message}</p>}
      <div className="grid gap-2 sm:grid-cols-[1fr_1.4fr]">
        {allowChildren ? (
          <Select aria-label="Nguồn megamenu" {...register(`${prefix}.dynamicSource`, { setValueAs: (v) => v || null })}>
            <option value="">Liên kết thường</option>
            {Object.entries(sourceLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
        ) : <span />}
        <Input aria-label="Mô tả" placeholder="Mô tả ngắn (megamenu)" {...register(`${prefix}.description`)} />
      </div>
      <div className="flex flex-wrap gap-4">
        <Checkbox label="Hiển thị" {...register(`${prefix}.isEnabled`)} />
        <Checkbox label="Mở tab mới" {...register(`${prefix}.openInNewTab`)} />
      </div>
      {allowChildren && (
        <details className="rounded-md bg-bg-subtle/60 p-2" open={children.fields.length > 0}>
          <summary className="cursor-pointer text-[13px] text-fg-muted">Mục con ({children.fields.length})</summary>
          <div className="mt-2">
            <Repeater items={children.fields} addLabel="Thêm mục con" max={30}
              itemLabel={(_, j) => getValues(`${prefix}.children.${j}.label`) || `Mục con ${j + 1}`}
              onAdd={() => children.append(blank())} onRemove={children.remove} onMove={children.move}
              renderItem={(_, j) => <ItemFields prefix={`${prefix}.children.${j}`} />} />
          </div>
        </details>
      )}
    </div>
  );
}
