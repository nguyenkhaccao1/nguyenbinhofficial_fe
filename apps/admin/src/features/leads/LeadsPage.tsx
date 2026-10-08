import { Eye, Mail, MailWarning, Phone, RefreshCw, Trash2 } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import { formatDateTime, Permissions } from '@nb/shared';
import { usePermission } from '@/auth/session';
import { DataTable, type DataTableColumn } from '@/components/data-table/DataTable';
import { Button, IconButton } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Badge, PageHeader, Spinner } from '@/components/ui/Feedback';
import { Field, Input, Select, Textarea } from '@/components/ui/Form';
import { errorMessage } from '@/lib/forms';
import { useListParams } from '@/lib/useListParams';
import {
  LeadFormTypeLabels, LeadStatusLabels, useLead, useLeadMutations, useLeads, type LeadListItem, type LeadStatus,
} from './api';

const statusTone: Record<LeadStatus, 'primary' | 'warning' | 'success' | 'danger' | 'neutral'> = {
  NEW: 'primary', CONTACTED: 'warning', QUALIFIED: 'warning', WON: 'success', LOST: 'neutral', SPAM: 'danger',
};

const tel = (phone: string) => `tel:${phone.replace(/\s/g, '')}`;

/** Yeu cau khach gui tu website (lien he / bao gia / demo). /leads/:id mo thang chi tiet (link trong email thong bao). */
export function LeadsPage() {
  const list = useListParams({ sort: '-createdAt', pageSize: 20 });
  const leads = useLeads({ q: list.q, page: list.page, pageSize: list.pageSize, status: list.filters.status, formType: list.filters.formType });
  const { id } = useParams();
  const navigate = useNavigate();

  const columns: DataTableColumn<LeadListItem>[] = [
    { id: 'time', header: 'Thời gian', alwaysVisible: true, className: 'whitespace-nowrap', cell: (l) => formatDateTime(l.createdAt) },
    {
      id: 'name', header: 'Khách hàng', alwaysVisible: true, cell: (l) => (
        <div>
          <p className="font-medium">{l.fullName}</p>
          <p className="text-[13px] text-fg-muted">{[l.company, l.email].filter(Boolean).join(' · ')}</p>
        </div>
      ),
    },
    { id: 'phone', header: 'Điện thoại', cell: (l) => <a href={tel(l.phone)} className="font-medium text-primary hover:underline">{l.phone}</a> },
    { id: 'type', header: 'Loại', cell: (l) => <Badge>{LeadFormTypeLabels[l.formType]}</Badge> },
    { id: 'need', header: 'Nhu cầu', cell: (l) => <span className="line-clamp-1 max-w-60 text-[13px]">{l.need ?? '—'}</span> },
    { id: 'status', header: 'Trạng thái', cell: (l) => <Badge tone={statusTone[l.status]}>{LeadStatusLabels[l.status]}</Badge> },
    {
      id: 'mail', header: 'Email TB', cell: (l) => l.notifyFailed
        ? <span title="Gửi email thông báo lỗi"><MailWarning className="size-4 text-red-600" /></span>
        : l.notifiedAt ? <span title={`Đã gửi ${formatDateTime(l.notifiedAt)}`}><Mail className="size-4 text-fg-muted" /></span> : '—',
    },
    {
      id: 'view', header: '', alwaysVisible: true, className: 'w-px',
      cell: (l) => <IconButton label="Xem chi tiết" icon={<Eye className="size-4" />} onClick={() => navigate(`/leads/${l.id}`)} />,
    },
  ];

  return (
    <>
      <PageHeader title="Yêu cầu khách hàng"
        description="Liên hệ, báo giá, demo gửi từ website. Email thông báo gửi tới danh sách trong Cấu hình → Form." />
      <DataTable
        tableId="leads"
        columns={columns}
        data={leads.data}
        isLoading={leads.isLoading}
        error={leads.error}
        onRetry={() => void leads.refetch()}
        getRowId={(l) => l.id}
        sort={list.sort}
        onSortChange={list.setSort}
        onPageChange={list.setPage}
        onPageSizeChange={list.setPageSize}
        emptyTitle="Chưa có yêu cầu nào"
        toolbar={
          <>
            <Input aria-label="Tìm" placeholder="Tên, số điện thoại, email, công ty…" className="h-9 w-full sm:w-72"
              value={list.search} onChange={(e) => list.setSearch(e.target.value)} />
            <Select aria-label="Trạng thái" className="h-9 w-auto" value={list.filters.status ?? ''}
              onChange={(e) => list.setFilter('status', e.target.value)}>
              <option value="">Mọi trạng thái</option>
              {Object.entries(LeadStatusLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
            <Select aria-label="Loại" className="h-9 w-auto" value={list.filters.formType ?? ''}
              onChange={(e) => list.setFilter('formType', e.target.value)}>
              <option value="">Mọi loại</option>
              {Object.entries(LeadFormTypeLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
          </>
        }
      />
      {id && <LeadDialog id={id} onClose={() => navigate('/leads')} />}
    </>
  );
}

function LeadDialog({ id, onClose }: { id: string; onClose: () => void }) {
  const lead = useLead(id);
  const { update, resend, remove } = useLeadMutations();
  const canUpdate = usePermission(Permissions.lead.update);
  const canDelete = usePermission(Permissions.lead.delete);
  const [status, setStatus] = useState<LeadStatus>('NEW');
  const [note, setNote] = useState('');
  const l = lead.data;

  useEffect(() => {
    if (!l) return;
    setStatus(l.status);
    setNote(l.note ?? '');
  }, [l]);

  const save = () => update.mutate({ id, status, note: note.trim() || null }, {
    onSuccess: () => toast.success('Đã lưu.'),
    onError: (e) => toast.error(errorMessage(e)),
  });

  const rows: [string, ReactNode][] = l ? [
    ['Loại', LeadFormTypeLabels[l.formType]],
    ['Điện thoại', <a href={tel(l.phone)} className="font-semibold text-primary hover:underline">{l.phone}</a>],
    ['Email', l.email ? <a href={`mailto:${l.email}`} className="text-primary hover:underline">{l.email}</a> : null],
    ['Công ty', l.company],
    ['Nhu cầu', l.need],
    ['Sản phẩm', l.productSlug],
    ['Dịch vụ', l.serviceSlug],
    ['Nội dung', l.message ? <span className="whitespace-pre-line">{l.message}</span> : null],
    ['Trang gửi', l.pageUrl ? <a href={l.pageUrl} target="_blank" rel="noreferrer" className="break-all text-primary hover:underline">{l.pageUrl}</a> : null],
    ['Nguồn', [l.utmSource, l.utmMedium, l.utmCampaign].filter(Boolean).join(' / ') || l.referrer],
    ['Thời gian', formatDateTime(l.createdAt)],
    ['Email thông báo', l.notifyError
      ? <span className="text-red-600">Lỗi: {l.notifyError}</span>
      : l.notifiedAt ? `Đã gửi ${formatDateTime(l.notifiedAt)}` : 'Đang chờ gửi'],
    ['IP', l.ipAddress],
  ] : [];

  return (
    <Dialog open onClose={onClose} size="lg" title={l ? l.fullName : 'Yêu cầu khách hàng'}
      footer={l && (
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <div className="flex gap-2">
            {canDelete && (
              <Button variant="ghost" icon={<Trash2 className="size-4" />} loading={remove.isPending}
                onClick={() => window.confirm('Xoá yêu cầu này?') && remove.mutate(id, {
                  onSuccess: () => { toast.success('Đã xoá.'); onClose(); },
                  onError: (e) => toast.error(errorMessage(e)),
                })}>
                Xoá
              </Button>
            )}
            {canUpdate && (
              <Button variant="secondary" icon={<RefreshCw className="size-4" />} loading={resend.isPending}
                onClick={() => resend.mutate(id, {
                  onSuccess: () => toast.success('Đang gửi lại email thông báo.'),
                  onError: (e) => toast.error(errorMessage(e)),
                })}>
                Gửi lại email
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <a href={tel(l.phone)} className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm font-medium hover:bg-bg-subtle">
              <Phone className="size-4" />Gọi
            </a>
            {canUpdate && <Button loading={update.isPending} onClick={save}>Lưu</Button>}
          </div>
        </div>
      )}>
      {lead.isLoading || !l ? <div className="grid place-items-center py-10"><Spinner /></div> : (
        <div className="space-y-6">
          <dl className="divide-y divide-border rounded-lg border border-border text-sm">
            {rows.filter(([, v]) => v !== null && v !== undefined && v !== '').map(([k, v]) => (
              <div key={k} className="grid grid-cols-[140px_1fr] gap-3 px-4 py-2.5">
                <dt className="text-fg-muted">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          {canUpdate && (
            <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
              <Field label="Trạng thái">
                {(a) => (
                  <Select {...a} value={status} onChange={(e) => setStatus(e.target.value as LeadStatus)}>
                    {Object.entries(LeadStatusLabels).map(([v, label]) => <option key={v} value={v}>{label}</option>)}
                  </Select>
                )}
              </Field>
              <Field label="Ghi chú nội bộ">
                {(a) => <Textarea {...a} rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Kết quả cuộc gọi, hẹn lịch demo…" />}
              </Field>
            </div>
          )}
        </div>
      )}
    </Dialog>
  );
}
