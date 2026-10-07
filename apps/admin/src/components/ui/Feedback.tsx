import { LoaderCircle, Lock, RefreshCw, TriangleAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { ApiError } from '@nb/shared';
import { cn } from '@/lib/cn';
import { Button } from './Button';

export function Spinner({ className, label = 'Đang tải' }: { className?: string; label?: string }) {
  return <LoaderCircle className={cn('size-5 animate-spin text-fg-muted', className)} aria-label={label} role="status" />;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-border/60', className)} aria-hidden />;
}

export function EmptyState({ icon, title, description, action }: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      {icon && <div className="text-fg-muted [&>svg]:size-10">{icon}</div>}
      <div>
        <p className="font-semibold">{title}</p>
        {description && <p className="mt-1 max-w-sm text-[13px] text-fg-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

/** Trang thai loi chung: 403 → thong bao quyen, con lai → nut Thu lai. */
export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  if (error instanceof ApiError && error.status === 403) {
    return (
      <EmptyState icon={<Lock />} title="Bạn không có quyền truy cập"
        description="Liên hệ quản trị viên nếu bạn cần quyền xem mục này." />
    );
  }

  return (
    <EmptyState
      icon={<TriangleAlert className="text-danger" />}
      title="Không tải được dữ liệu"
      description={error instanceof Error ? error.message : undefined}
      action={onRetry && (
        <Button variant="secondary" size="sm" icon={<RefreshCw className="size-4" />} onClick={onRetry}>Thử lại</Button>
      )}
    />
  );
}

const badgeTones = {
  neutral: 'bg-bg-subtle text-fg-muted border-border',
  primary: 'bg-primary-soft text-primary border-primary/15',
  success: 'bg-success-soft text-success border-success/15',
  warning: 'bg-warning-soft text-warning border-warning/20',
  danger: 'bg-danger-soft text-danger border-danger/15',
} as const;

export function Badge({ tone = 'neutral', children, className }: {
  tone?: keyof typeof badgeTones;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={cn('inline-flex items-center rounded-sm border px-1.5 py-0.5 text-xs font-medium', badgeTones[tone], className)}>
      {children}
    </span>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('rounded-lg border border-border bg-white', className)}>{children}</div>;
}

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-fg-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
