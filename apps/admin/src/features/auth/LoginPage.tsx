import { zodResolver } from '@hookform/resolvers/zod';
import { ApiError } from '@nb/shared';
import { useForm } from 'react-hook-form';
import { Navigate, useNavigate, useSearchParams } from 'react-router';
import { z } from 'zod';
import { useSession } from '@/auth/session';
import { Button } from '@/components/ui/Button';
import { Checkbox, Field, Input } from '@/components/ui/Form';
import { applyServerErrors, errorMessage } from '@/lib/forms';
import { login } from '@/lib/http';

const schema = z.object({
  email: z.string().trim().min(1, 'Vui lòng nhập email.').email('Email không hợp lệ.'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu.'),
  rememberMe: z.boolean(),
});

type Values = z.infer<typeof schema>;

export function LoginPage() {
  const status = useSession((s) => s.status);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const returnTo = safeReturnTo(params.get('returnTo'));

  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', rememberMe: false },
  });

  if (status === 'authenticated') return <Navigate to={returnTo} replace />;

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login(values.email, values.password, values.rememberMe);
      navigate(returnTo, { replace: true });
    } catch (error) {
      if (error instanceof ApiError && error.isValidation) applyServerErrors(error, setError);
      else setError('root', { message: errorMessage(error) });
    }
  });

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-dark p-12 text-white lg:flex">
        <div className="flex items-center gap-2 font-semibold">
          <span className="grid size-8 place-items-center rounded-md bg-white text-xs font-bold text-dark">NB</span>
          Nguyên Bình
        </div>
        <div>
          <p className="max-w-md text-3xl leading-tight font-semibold tracking-tight">
            Quản trị nội dung, sản phẩm, dự án và khách hàng tiềm năng.
          </p>
          <p className="mt-4 max-w-md text-white/60">Mọi thay đổi đều được ghi nhật ký.</p>
        </div>
        <p className="text-xs text-white/40">nguyenbinhofficial.com.vn</p>
      </div>

      <div className="flex items-center justify-center bg-white px-6 py-12">
        <form onSubmit={onSubmit} noValidate className="w-full max-w-sm space-y-5">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Đăng nhập</h1>
            <p className="mt-1 text-fg-muted">Dành cho quản trị viên website.</p>
          </div>

          {errors.root && (
            <p role="alert" className="rounded-md border border-danger/20 bg-danger-soft px-3 py-2 text-danger">
              {errors.root.message}
            </p>
          )}

          <Field label="Email" error={errors.email?.message} required>
            {(p) => <Input type="email" autoComplete="username" autoFocus {...p} {...register('email')} />}
          </Field>
          <Field label="Mật khẩu" error={errors.password?.message} required>
            {(p) => <Input type="password" autoComplete="current-password" {...p} {...register('password')} />}
          </Field>
          <Checkbox label="Ghi nhớ đăng nhập trên thiết bị này" {...register('rememberMe')} />

          <Button type="submit" className="w-full" loading={isSubmitting}>Đăng nhập</Button>
        </form>
      </div>
    </div>
  );
}

/** Chi chap nhan duong dan noi bo de tranh open redirect. */
function safeReturnTo(value: string | null): string {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/';
}
