import { useQuery } from '@tanstack/react-query';
import { History, Image, Settings, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { formatDateTime, Permissions, type PagedResult } from '@nb/shared';
import { usePermission, useSession } from '@/auth/session';
import { Badge, Card, ErrorState, PageHeader, Skeleton } from '@/components/ui/Feedback';
import { api } from '@/lib/http';
import { useAuditLogs } from '@/features/system/api';

/** Dem tong so ban ghi bang API danh sach (pageSize=1). */
function useTotal(path: string, enabled: boolean) {
  return useQuery({
    queryKey: ['total', path],
    queryFn: ({ signal }) => api<PagedResult<unknown>>(path, { query: { pageSize: 1 }, signal }),
    enabled,
    select: (d) => d.totalItems,
  });
}

export function DashboardPage() {
  const user = useSession((s) => s.user);
  const canMedia = usePermission(Permissions.media.view);
  const canUsers = usePermission(Permissions.user.view);
  const canAudit = usePermission(Permissions.audit.view);
  const canSettings = usePermission(Permissions.settings.view);

  const media = useTotal('/admin/media', canMedia);
  const images = useQuery({
    queryKey: ['total', 'images'],
    queryFn: ({ signal }) => api<PagedResult<unknown>>('/admin/media', { query: { pageSize: 1, kind: 'IMAGE' }, signal }),
    enabled: canMedia,
    select: (d) => d.totalItems,
  });
  const users = useTotal('/admin/users', canUsers);
  const recent = useAuditLogs({ pageSize: 8, sort: '-createdAt' }, canAudit);

  return (
    <>
      <PageHeader title={`Xin chào, ${user?.fullName ?? ''}`}
        description="Số liệu dự án, sản phẩm, bài viết và lead sẽ hiển thị khi các module tương ứng được triển khai." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {canMedia && <Stat label="File media" value={media.data} loading={media.isLoading} to="/media" icon={<Image />} />}
        {canMedia && <Stat label="Hình ảnh" value={images.data} loading={images.isLoading} to="/media?kind=IMAGE" icon={<Image />} />}
        {canUsers && <Stat label="Người dùng quản trị" value={users.data} loading={users.isLoading} to="/system/users" icon={<Users />} />}
        {canSettings && (
          <Link to="/website/settings" className="group rounded-lg border border-border bg-white p-5 hover:border-primary/40">
            <div className="flex items-center justify-between text-fg-muted"><span>Cấu hình website</span><Settings className="size-4" /></div>
            <p className="mt-3 font-medium group-hover:text-primary">Thương hiệu, liên hệ, tracking, SEO →</p>
          </Link>
        )}
      </div>

      {canAudit && (
        <Card className="mt-6">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <h2 className="flex items-center gap-2 font-semibold"><History className="size-4" /> Thay đổi gần đây</h2>
            <Link to="/system/audit-logs" className="text-[13px] text-primary hover:underline">Xem tất cả</Link>
          </div>
          {recent.error ? <ErrorState error={recent.error} onRetry={() => void recent.refetch()} /> : (
            <ul className="divide-y divide-border">
              {recent.isLoading
                ? Array.from({ length: 5 }, (_, i) => <li key={i} className="px-5 py-3"><Skeleton className="h-4 w-2/3" /></li>)
                : recent.data?.items.length === 0
                  ? <li className="px-5 py-6 text-center text-fg-muted">Chưa có thay đổi nào.</li>
                  : recent.data?.items.map((l) => (
                    <li key={l.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-3 text-[13px]">
                      <Badge>{l.action}</Badge>
                      <span className="font-medium">{l.entityType ?? '—'}</span>
                      <span className="text-fg-muted">{l.userName ?? 'Hệ thống'}</span>
                      <span className="ml-auto text-fg-muted">{formatDateTime(l.createdAt)}</span>
                    </li>
                  ))}
            </ul>
          )}
        </Card>
      )}
    </>
  );
}

function Stat({ label, value, loading, to, icon }: { label: string; value?: number; loading: boolean; to: string; icon: ReactNode }) {
  return (
    <Link to={to} className="rounded-lg border border-border bg-white p-5 hover:border-primary/40">
      <div className="flex items-center justify-between text-fg-muted [&>svg]:size-4"><span>{label}</span>{icon}</div>
      {loading ? <Skeleton className="mt-3 h-8 w-16" /> : (
        <p className="mt-2 font-mono text-3xl font-semibold tracking-tight">{value?.toLocaleString('vi-VN') ?? '—'}</p>
      )}
    </Link>
  );
}
