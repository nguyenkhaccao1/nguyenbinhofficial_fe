import { Lock } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { EmptyState, Spinner } from '@/components/ui/Feedback';
import { refreshSession } from '@/lib/http';
import { usePermission, useSession } from './session';

/** Lan dau mo admin: thu khoi phuc phien tu cookie refresh truoc khi quyet dinh chuyen ve /login. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const status = useSession((s) => s.status);
  const location = useLocation();

  useEffect(() => {
    if (status === 'unknown') void refreshSession();
  }, [status]);

  if (status === 'unknown') {
    return (
      <div className="grid min-h-screen place-items-center">
        <Spinner className="size-6" />
      </div>
    );
  }

  if (status === 'anonymous') {
    const returnTo = location.pathname + location.search;
    return <Navigate to={`/login${returnTo !== '/' ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`} replace />;
  }

  return children;
}

/** An noi dung khi thieu quyen (chi la UX — backend van kiem tra lai). */
export function RequirePermission({ permission, children }: { permission: string; children: ReactNode }) {
  const allowed = usePermission(permission);
  if (!allowed) {
    return (
      <EmptyState icon={<Lock />} title="Bạn không có quyền truy cập"
        description="Liên hệ quản trị viên nếu bạn cần quyền xem mục này." />
    );
  }
  return children;
}

export function Can({ permission, children }: { permission: string; children: ReactNode }) {
  return usePermission(permission) ? children : null;
}
