import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, Pencil, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { PermissionActionLabels, PermissionModuleLabels, Permissions } from '@nb/shared';
import { toast } from 'sonner';
import { z } from 'zod';
import { Can } from '@/auth/guards';
import { hasPermission, useSession } from '@/auth/session';
import { Button, IconButton } from '@/components/ui/Button';
import { Dialog, useConfirm } from '@/components/ui/Dialog';
import { Badge, Card, EmptyState, ErrorState, PageHeader, Skeleton } from '@/components/ui/Feedback';
import { Field, Input, Textarea } from '@/components/ui/Form';
import { applyServerErrors, errorMessage } from '@/lib/forms';
import { usePermissionDefs, useRoleMutations, useRoles, type PermissionDef, type Role } from './api';

export function RolesPage() {
  const roles = useRoles();
  const { remove } = useRoleMutations();
  const confirm = useConfirm();
  const [editing, setEditing] = useState<Role | 'new' | null>(null);

  return (
    <>
      <PageHeader
        title="Vai trò & quyền"
        description="Quyền được kiểm tra ở backend cho từng thao tác; thay đổi có hiệu lực ngay ở yêu cầu kế tiếp."
        actions={
          <Can permission={Permissions.role.create}>
            <Button icon={<Plus className="size-4" />} onClick={() => setEditing('new')}>Thêm vai trò</Button>
          </Can>
        }
      />

      {roles.error ? (
        <Card><ErrorState error={roles.error} onRetry={() => void roles.refetch()} /></Card>
      ) : roles.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-36" />)}
        </div>
      ) : roles.data?.length === 0 ? (
        <Card><EmptyState icon={<ShieldCheck />} title="Chưa có vai trò" /></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {roles.data?.map((role) => (
            <Card key={role.id} className="flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="flex items-center gap-2 font-semibold">
                    {role.name}
                    {role.isSystem && <Badge>Hệ thống</Badge>}
                  </h2>
                  <p className="mt-1 text-[13px] text-fg-muted">{role.description || '—'}</p>
                </div>
                <div className="flex gap-0.5">
                  <Can permission={Permissions.role.update}>
                    <IconButton label={role.name === 'SuperAdmin' ? 'Xem quyền' : 'Sửa quyền'}
                      icon={role.name === 'SuperAdmin' ? <Lock className="size-4" /> : <Pencil className="size-4" />}
                      onClick={() => setEditing(role)} />
                  </Can>
                  {!role.isSystem && (
                    <Can permission={Permissions.role.delete}>
                      <IconButton label="Xoá vai trò" className="text-danger" icon={<Trash2 className="size-4" />}
                        onClick={async () => {
                          if (!(await confirm({ title: `Xoá vai trò ${role.name}?`, confirmLabel: 'Xoá' }))) return;
                          try {
                            await remove.mutateAsync(role.id);
                            toast.success('Đã xoá vai trò.');
                          } catch (error) {
                            toast.error(errorMessage(error));
                          }
                        }} />
                    </Can>
                  )}
                </div>
              </div>
              <div className="mt-auto flex gap-4 pt-4 text-[13px] text-fg-muted">
                <span><strong className="text-fg">{role.userCount}</strong> người dùng</span>
                <span><strong className="text-fg">{role.permissions.length}</strong> quyền</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {editing && <RoleEditor role={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
    </>
  );
}

const schema = z.object({
  name: z.string().trim().min(1, 'Vui lòng nhập tên vai trò.').max(64)
    .regex(/^[A-Za-z][A-Za-z0-9_-]*$/, "Chỉ gồm chữ không dấu, số, '-' và '_'."),
  description: z.string().max(500),
  permissions: z.array(z.string()),
});

type Values = z.infer<typeof schema>;

function RoleEditor({ role, onClose }: { role: Role | null; onClose: () => void }) {
  const defs = usePermissionDefs();
  const { create, update } = useRoleMutations();
  const me = useSession((s) => s.user);
  const readOnly = role?.name === 'SuperAdmin';

  const modules = useMemo(() => {
    const grouped = new Map<string, PermissionDef[]>();
    for (const def of defs.data ?? []) grouped.set(def.module, [...(grouped.get(def.module) ?? []), def]);
    return [...grouped.entries()];
  }, [defs.data]);

  const { register, control, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: role?.name ?? '', description: role?.description ?? '', permissions: role?.permissions ?? [] },
  });

  const onSubmit = handleSubmit(async (values) => {
    const input = { ...values, description: values.description || null };
    try {
      if (role) await update.mutateAsync({ id: role.id, input });
      else await create.mutateAsync(input);
      toast.success('Đã lưu vai trò.');
      onClose();
    } catch (error) {
      applyServerErrors(error, setError);
    }
  });

  return (
    <Dialog open onClose={onClose} size="xl" title={role ? `Vai trò ${role.name}` : 'Thêm vai trò'}
      description={readOnly ? 'SuperAdmin luôn có toàn quyền và không thể chỉnh sửa.' : 'Bạn chỉ có thể cấp những quyền mà chính bạn đang có.'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>{readOnly ? 'Đóng' : 'Huỷ'}</Button>
          {!readOnly && <Button type="submit" form="role-form" loading={isSubmitting}>Lưu</Button>}
        </>
      }>
      <form id="role-form" onSubmit={onSubmit} noValidate className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-[240px_1fr]">
          <Field label="Tên vai trò" error={errors.name?.message} required
            hint={role?.isSystem ? 'Không đổi được tên vai trò hệ thống.' : undefined}>
            {(p) => <Input {...p} disabled={readOnly || role?.isSystem} {...register('name')} />}
          </Field>
          <Field label="Mô tả" error={errors.description?.message}>
            {(p) => <Textarea rows={1} {...p} disabled={readOnly} {...register('description')} />}
          </Field>
        </div>

        {defs.error ? <ErrorState error={defs.error} onRetry={() => void defs.refetch()} /> : (
          <Controller control={control} name="permissions" render={({ field }) => {
            const set = new Set(field.value);
            const toggle = (codes: string[], on: boolean) => {
              const next = new Set(set);
              for (const c of codes) (on ? next.add(c) : next.delete(c));
              field.onChange([...next]);
            };
            return (
              <div className="overflow-x-auto rounded-md border border-border">
                <table className="w-full text-left">
                  <caption className="sr-only">Ma trận quyền</caption>
                  <thead>
                    <tr className="border-b border-border bg-bg-subtle text-xs text-fg-muted uppercase">
                      <th scope="col" className="px-4 py-2.5 font-medium">Module</th>
                      <th scope="col" className="px-4 py-2.5 font-medium">Quyền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modules.map(([module, perms]) => {
                      const codes = perms.map((p) => p.code);
                      const allOn = codes.every((c) => set.has(c));
                      return (
                        <tr key={module} className="border-b border-border last:border-0">
                          <th scope="row" className="w-64 px-4 py-3 align-top font-medium">
                            <label className="flex items-center gap-2">
                              <input type="checkbox" className="size-4 accent-primary" checked={allOn}
                                disabled={readOnly} onChange={(e) => toggle(codes, e.target.checked)}
                                aria-label={`Chọn tất cả quyền ${PermissionModuleLabels[module] ?? module}`} />
                              {PermissionModuleLabels[module] ?? module}
                            </label>
                          </th>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-x-5 gap-y-2">
                              {perms.map((p) => {
                                const grantable = hasPermission(me, p.code);
                                return (
                                  <label key={p.code} title={grantable ? p.code : `${p.code} — bạn không có quyền này`}
                                    className="flex items-center gap-1.5 has-disabled:opacity-50">
                                    <input type="checkbox" className="size-4 accent-primary" checked={set.has(p.code)}
                                      disabled={readOnly || (!grantable && !set.has(p.code))}
                                      onChange={(e) => toggle([p.code], e.target.checked)} />
                                    {PermissionActionLabels[p.action] ?? p.action}
                                  </label>
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          }} />
        )}
      </form>
    </Dialog>
  );
}
