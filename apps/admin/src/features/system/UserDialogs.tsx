import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { useSession } from '@/auth/session';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { ErrorState, Spinner } from '@/components/ui/Feedback';
import { Checkbox, Field, Input } from '@/components/ui/Form';
import { applyServerErrors } from '@/lib/forms';
import { useUser, useUserMutations, type Role, type UserDetail, type UserListItem } from './api';

const password = z.string().min(10, 'Mật khẩu tối thiểu 10 ký tự.').max(128)
  .regex(/[a-z]/, 'Mật khẩu phải có ít nhất 1 chữ thường.').regex(/\d/, 'Mật khẩu phải có ít nhất 1 chữ số.');

const baseSchema = z.object({
  fullName: z.string().trim().min(1, 'Vui lòng nhập họ tên.').max(150),
  phoneNumber: z.string().trim().max(30),
  roles: z.array(z.string()).min(1, 'Chọn ít nhất 1 vai trò.'),
  isActive: z.boolean(),
});

const createSchema = baseSchema.extend({
  email: z.string().trim().min(1, 'Vui lòng nhập email.').email('Email không hợp lệ.'),
  password,
});

type Values = z.infer<typeof createSchema>;

export function UserFormDialog({ user, roles, onClose }: { user: UserListItem | null; roles: Role[]; onClose: () => void }) {
  const detail = useUser(user?.id ?? null);

  if (user && !detail.data) {
    return (
      <Dialog open onClose={onClose} title={`Sửa ${user.email}`}>
        {detail.error ? <ErrorState error={detail.error} onRetry={() => void detail.refetch()} />
          : <div className="grid place-items-center py-10"><Spinner /></div>}
      </Dialog>
    );
  }

  return <UserForm user={detail.data ?? null} roles={roles} onClose={onClose} />;
}

function UserForm({ user, roles, onClose }: { user: UserDetail | null; roles: Role[]; onClose: () => void }) {
  const isNew = !user;
  const { create, update } = useUserMutations();
  const isSuperAdmin = useSession((s) => s.user?.roles.includes('SuperAdmin') ?? false);

  const { register, control, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(isNew ? createSchema : baseSchema.extend({ email: z.string(), password: z.string() })),
    defaultValues: {
      email: user?.email ?? '',
      fullName: user?.fullName ?? '',
      phoneNumber: user?.phoneNumber ?? '',
      password: '',
      roles: user?.roles ?? [],
      isActive: user?.isActive ?? true,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    const common = {
      fullName: values.fullName,
      phoneNumber: values.phoneNumber || null,
      roles: values.roles,
      isActive: values.isActive,
    };
    try {
      if (isNew) await create.mutateAsync({ ...common, email: values.email, password: values.password });
      else await update.mutateAsync({ id: user.id, input: common });
      toast.success(isNew ? 'Đã tạo người dùng.' : 'Đã lưu.');
      onClose();
    } catch (error) {
      applyServerErrors(error, setError);
    }
  });

  return (
    <Dialog
      open
      onClose={onClose}
      title={isNew ? 'Thêm người dùng' : `Sửa ${user.email}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Huỷ</Button>
          <Button type="submit" form="user-form" loading={isSubmitting}>{isNew ? 'Tạo' : 'Lưu'}</Button>
        </>
      }
    >
      <form id="user-form" onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
        {isNew && (
          <Field label="Email đăng nhập" error={errors.email?.message} required className="sm:col-span-2">
            {(p) => <Input type="email" autoComplete="off" {...p} {...register('email')} />}
          </Field>
        )}
        <Field label="Họ tên" error={errors.fullName?.message} required>
          {(p) => <Input {...p} {...register('fullName')} />}
        </Field>
        <Field label="Điện thoại" error={errors.phoneNumber?.message}>
          {(p) => <Input type="tel" {...p} {...register('phoneNumber')} />}
        </Field>
        {isNew && (
          <Field label="Mật khẩu" error={errors.password?.message} required className="sm:col-span-2"
            hint="Tối thiểu 10 ký tự, gồm chữ thường và chữ số.">
            {(p) => <Input type="password" autoComplete="new-password" {...p} {...register('password')} />}
          </Field>
        )}

        <fieldset className="sm:col-span-2">
          <legend className="mb-2 text-[13px] font-medium">Vai trò <span className="text-danger">*</span></legend>
          <Controller
            control={control}
            name="roles"
            render={({ field }) => (
              <div className="grid gap-2 sm:grid-cols-2">
                {roles.map((role) => {
                  const disabled = role.name === 'SuperAdmin' && !isSuperAdmin;
                  return (
                    <label key={role.id}
                      className="flex cursor-pointer gap-2.5 rounded-md border border-border p-3 has-checked:border-primary has-checked:bg-primary-soft/50 has-disabled:cursor-not-allowed has-disabled:opacity-50">
                      <input type="checkbox" className="mt-0.5 size-4 accent-primary" disabled={disabled}
                        checked={field.value.includes(role.name)}
                        onChange={(e) => field.onChange(e.target.checked
                          ? [...field.value, role.name] : field.value.filter((r) => r !== role.name))} />
                      <span>
                        <span className="block font-medium">{role.name}</span>
                        {role.description && <span className="block text-xs text-fg-muted">{role.description}</span>}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          />
          {errors.roles && <p role="alert" className="mt-1.5 text-[13px] text-danger">{errors.roles.message}</p>}
        </fieldset>

        <Checkbox className="sm:col-span-2" label="Tài khoản đang hoạt động" {...register('isActive')} />
      </form>
    </Dialog>
  );
}

const resetSchema = z.object({ newPassword: password });

export function ResetPasswordDialog({ user, onClose }: { user: UserListItem; onClose: () => void }) {
  const { resetPassword } = useUserMutations();
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<{ newPassword: string }>({
    resolver: zodResolver(resetSchema),
    defaultValues: { newPassword: '' },
  });

  const onSubmit = handleSubmit(async ({ newPassword }) => {
    try {
      await resetPassword.mutateAsync({ id: user.id, newPassword });
      toast.success('Đã đặt lại mật khẩu. Người dùng bị đăng xuất khỏi mọi thiết bị.');
      onClose();
    } catch (error) {
      applyServerErrors(error, setError);
    }
  });

  return (
    <Dialog open onClose={onClose} size="sm" title="Đặt lại mật khẩu" description={user.email}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Huỷ</Button>
          <Button type="submit" form="reset-form" loading={isSubmitting}>Đặt lại</Button>
        </>
      }>
      <form id="reset-form" onSubmit={onSubmit} noValidate>
        <Field label="Mật khẩu mới" error={errors.newPassword?.message} required
          hint="Gửi mật khẩu cho người dùng qua kênh an toàn và yêu cầu đổi sau khi đăng nhập.">
          {(p) => <Input type="password" autoComplete="new-password" {...p} {...register('newPassword')} />}
        </Field>
      </form>
    </Dialog>
  );
}
