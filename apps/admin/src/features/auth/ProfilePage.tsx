import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { useSession, type SessionUser } from '@/auth/session';
import { Button } from '@/components/ui/Button';
import { Card, PageHeader } from '@/components/ui/Feedback';
import { Field, Input } from '@/components/ui/Form';
import { applyServerErrors } from '@/lib/forms';
import { api, changePassword } from '@/lib/http';

const profileSchema = z.object({ fullName: z.string().trim().min(1, 'Vui lòng nhập họ tên.').max(150) });

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại.'),
  newPassword: z.string().min(10, 'Mật khẩu mới tối thiểu 10 ký tự.').max(128)
    .regex(/[a-z]/, 'Phải có ít nhất 1 chữ thường.').regex(/\d/, 'Phải có ít nhất 1 chữ số.'),
  confirmPassword: z.string(),
}).refine((v) => v.newPassword === v.confirmPassword, { path: ['confirmPassword'], message: 'Mật khẩu nhập lại không khớp.' })
  .refine((v) => v.newPassword !== v.currentPassword, { path: ['newPassword'], message: 'Mật khẩu mới phải khác mật khẩu hiện tại.' });

export function ProfilePage() {
  const user = useSession((s) => s.user)!;
  const setUser = useSession((s) => s.setUser);

  const profile = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: user.fullName },
  });

  const password = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const saveProfile = profile.handleSubmit(async (values) => {
    try {
      const updated = await api<SessionUser>('/admin/auth/profile', {
        method: 'PUT',
        body: { fullName: values.fullName, avatarMediaId: user.avatarMediaId },
      });
      setUser(updated);
      profile.reset({ fullName: updated.fullName });
      toast.success('Đã cập nhật hồ sơ.');
    } catch (error) {
      applyServerErrors(error, profile.setError);
    }
  });

  const savePassword = password.handleSubmit(async (values) => {
    try {
      await changePassword(values.currentPassword, values.newPassword);
      password.reset();
      toast.success('Đã đổi mật khẩu. Các thiết bị khác đã bị đăng xuất.');
    } catch (error) {
      applyServerErrors(error, password.setError);
    }
  });

  return (
    <>
      <PageHeader title="Hồ sơ cá nhân" description={user.email} />
      <div className="grid max-w-4xl gap-6">
        <Card className="p-6">
          <h2 className="mb-4 font-semibold">Thông tin</h2>
          <form onSubmit={saveProfile} noValidate className="grid max-w-md gap-4">
            <Field label="Họ tên" error={profile.formState.errors.fullName?.message} required>
              {(p) => <Input {...p} {...profile.register('fullName')} />}
            </Field>
            <p className="text-[13px] text-fg-muted">Vai trò: {user.roles.join(', ')}</p>
            <div>
              <Button type="submit" loading={profile.formState.isSubmitting} disabled={!profile.formState.isDirty}>Lưu</Button>
            </div>
          </form>
        </Card>

        <Card className="p-6">
          <h2 className="mb-1 font-semibold">Đổi mật khẩu</h2>
          <p className="mb-4 text-[13px] text-fg-muted">Sau khi đổi, các phiên đăng nhập trên thiết bị khác sẽ bị đăng xuất.</p>
          <form onSubmit={savePassword} noValidate className="grid max-w-md gap-4">
            <Field label="Mật khẩu hiện tại" error={password.formState.errors.currentPassword?.message} required>
              {(p) => <Input type="password" autoComplete="current-password" {...p} {...password.register('currentPassword')} />}
            </Field>
            <Field label="Mật khẩu mới" error={password.formState.errors.newPassword?.message} required
              hint="Tối thiểu 10 ký tự, gồm chữ thường và chữ số.">
              {(p) => <Input type="password" autoComplete="new-password" {...p} {...password.register('newPassword')} />}
            </Field>
            <Field label="Nhập lại mật khẩu mới" error={password.formState.errors.confirmPassword?.message} required>
              {(p) => <Input type="password" autoComplete="new-password" {...p} {...password.register('confirmPassword')} />}
            </Field>
            <div>
              <Button type="submit" loading={password.formState.isSubmitting}>Đổi mật khẩu</Button>
            </div>
          </form>
        </Card>
      </div>
    </>
  );
}
