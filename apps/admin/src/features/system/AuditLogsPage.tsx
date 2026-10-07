import { Eye } from 'lucide-react';
import { useState } from 'react';
import { formatDateTime } from '@nb/shared';
import { DataTable, type DataTableColumn } from '@/components/data-table/DataTable';
import { IconButton } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Badge, PageHeader } from '@/components/ui/Feedback';
import { Input, Select } from '@/components/ui/Form';
import { useListParams } from '@/lib/useListParams';
import { useAuditLogs, type AuditLog } from './api';

const actionTone: Record<string, 'success' | 'primary' | 'danger' | 'warning' | 'neutral'> = {
  CREATE: 'success',
  UPDATE: 'primary',
  DELETE: 'danger',
  RESTORE: 'success',
  LOGIN_FAILED: 'warning',
  TOKEN_REUSE: 'danger',
  PERMISSION_CHANGE: 'warning',
};

const actions = ['CREATE', 'UPDATE', 'DELETE', 'RESTORE', 'PUBLISH', 'UNPUBLISH', 'LOGIN', 'LOGIN_FAILED', 'LOGOUT',
  'TOKEN_REUSE', 'PERMISSION_CHANGE', 'PASSWORD_RESET'];

export function AuditLogsPage() {
  const list = useListParams({ sort: '-createdAt', pageSize: 50 });
  const logs = useAuditLogs({
    q: list.q, page: list.page, pageSize: list.pageSize, sort: list.sort,
    action: list.filters.action, entityType: list.filters.entityType,
    from: list.filters.from ? new Date(list.filters.from).toISOString() : undefined,
    to: list.filters.to ? new Date(`${list.filters.to}T23:59:59`).toISOString() : undefined,
  });
  const [viewing, setViewing] = useState<AuditLog | null>(null);

  const columns: DataTableColumn<AuditLog>[] = [
    { id: 'time', header: 'Thời gian', sortKey: 'createdAt', alwaysVisible: true, className: 'whitespace-nowrap',
      cell: (l) => formatDateTime(l.createdAt) },
    { id: 'user', header: 'Người thực hiện', cell: (l) => l.userName ?? <span className="text-fg-muted">Hệ thống</span> },
    { id: 'action', header: 'Hành động', sortKey: 'action',
      cell: (l) => <Badge tone={actionTone[l.action] ?? 'neutral'}>{l.action}</Badge> },
    { id: 'entity', header: 'Đối tượng', sortKey: 'entityType',
      cell: (l) => l.entityType ? (
        <span>{l.entityType}<span className="ml-1.5 font-mono text-xs text-fg-muted">{l.entityId?.slice(0, 8)}</span></span>
      ) : '—' },
    { id: 'changes', header: 'Trường thay đổi', cell: (l) => (
      <span className="line-clamp-1 max-w-72 text-[13px] text-fg-muted">{l.changedColumns ?? '—'}</span>
    ) },
    { id: 'ip', header: 'IP', defaultHidden: true, cell: (l) => <span className="font-mono text-xs">{l.ipAddress ?? '—'}</span> },
    { id: 'view', header: '', alwaysVisible: true, className: 'w-px',
      cell: (l) => <IconButton label="Xem chi tiết" icon={<Eye className="size-4" />} onClick={() => setViewing(l)} /> },
  ];

  return (
    <>
      <PageHeader title="Nhật ký thay đổi" description="Ai đã thay đổi gì, khi nào, từ đâu." />
      <DataTable
        tableId="audit-logs"
        columns={columns}
        data={logs.data}
        isLoading={logs.isLoading}
        error={logs.error}
        onRetry={() => void logs.refetch()}
        getRowId={(l) => l.id}
        sort={list.sort}
        onSortChange={list.setSort}
        onPageChange={list.setPage}
        onPageSizeChange={list.setPageSize}
        emptyTitle="Không có bản ghi phù hợp"
        toolbar={
          <>
            <Input aria-label="Tìm theo người dùng hoặc mã đối tượng" placeholder="Người dùng hoặc mã đối tượng…"
              className="h-9 w-full sm:w-64" value={list.search} onChange={(e) => list.setSearch(e.target.value)} />
            <Select aria-label="Hành động" className="h-9 w-auto" value={list.filters.action ?? ''}
              onChange={(e) => list.setFilter('action', e.target.value)}>
              <option value="">Mọi hành động</option>
              {actions.map((a) => <option key={a} value={a}>{a}</option>)}
            </Select>
            <Input aria-label="Loại đối tượng" placeholder="Loại (vd SiteSetting)" className="h-9 w-44"
              defaultValue={list.filters.entityType ?? ''} onBlur={(e) => list.setFilter('entityType', e.target.value.trim())} />
            <Input type="date" aria-label="Từ ngày" className="h-9 w-auto" value={list.filters.from ?? ''}
              onChange={(e) => list.setFilter('from', e.target.value)} />
            <Input type="date" aria-label="Đến ngày" className="h-9 w-auto" value={list.filters.to ?? ''}
              onChange={(e) => list.setFilter('to', e.target.value)} />
          </>
        }
      />

      {viewing && (
        <Dialog open onClose={() => setViewing(null)} size="lg" title={`${viewing.action} · ${viewing.entityType ?? ''}`}
          description={`${formatDateTime(viewing.createdAt)} · ${viewing.userName ?? 'Hệ thống'} · ${viewing.ipAddress ?? ''}`}>
          <dl className="mb-4 grid grid-cols-[140px_1fr] gap-y-1.5 text-[13px]">
            <dt className="text-fg-muted">Mã đối tượng</dt><dd className="font-mono break-all">{viewing.entityId ?? '—'}</dd>
            <dt className="text-fg-muted">Correlation ID</dt><dd className="font-mono break-all">{viewing.correlationId ?? '—'}</dd>
            <dt className="text-fg-muted">Trình duyệt</dt><dd className="break-all">{viewing.userAgent ?? '—'}</dd>
          </dl>
          <ChangeTable oldJson={viewing.oldValues} newJson={viewing.newValues} />
        </Dialog>
      )}
    </>
  );
}

function parse(json: string | null): Record<string, unknown> {
  if (!json) return {};
  try {
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return { value: json };
  }
}

function show(value: unknown) {
  if (value === undefined) return <span className="text-fg-muted">—</span>;
  if (value === null) return <span className="text-fg-muted">null</span>;
  return typeof value === 'string' ? value : JSON.stringify(value, null, 2);
}

function ChangeTable({ oldJson, newJson }: { oldJson: string | null; newJson: string | null }) {
  const before = parse(oldJson);
  const after = parse(newJson);
  const fields = [...new Set([...Object.keys(before), ...Object.keys(after)])];
  if (fields.length === 0) return <p className="text-fg-muted">Không có dữ liệu thay đổi.</p>;

  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full text-left text-[13px]">
        <thead>
          <tr className="border-b border-border bg-bg-subtle text-xs text-fg-muted uppercase">
            <th className="px-3 py-2 font-medium">Trường</th>
            <th className="px-3 py-2 font-medium">Trước</th>
            <th className="px-3 py-2 font-medium">Sau</th>
          </tr>
        </thead>
        <tbody>
          {fields.map((f) => (
            <tr key={f} className="border-b border-border align-top last:border-0">
              <th scope="row" className="px-3 py-2 font-medium">{f}</th>
              <td className="max-w-80 px-3 py-2 font-mono break-all whitespace-pre-wrap text-danger/90">{show(before[f])}</td>
              <td className="max-w-80 px-3 py-2 font-mono break-all whitespace-pre-wrap text-success">{show(after[f])}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
