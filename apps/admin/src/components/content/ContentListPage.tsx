import { Copy, Pencil, Plus, RotateCcw, Search, Send, Trash2, EyeOff } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import { ContentStatusLabels, type ContentStatus } from '@nb/shared';
import { toast } from 'sonner';
import { usePermission } from '@/auth/session';
import { DataTable, type DataTableColumn } from '@/components/data-table/DataTable';
import { Button, IconButton } from '@/components/ui/Button';
import { useConfirm } from '@/components/ui/Dialog';
import { PageHeader } from '@/components/ui/Feedback';
import { Checkbox, Input, Select } from '@/components/ui/Form';
import { useContentList, useContentMutations } from '@/lib/content';
import { errorMessage } from '@/lib/forms';
import { useListParams } from '@/lib/useListParams';

export interface ListFilter {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

interface ContentListPageProps<T extends { id: string }> {
  resource: string;
  permission: string;
  title: string;
  description?: ReactNode;
  label: string;
  /** Duong dan man soan (/projects → /projects/:id, /projects/new). Bo trong khi dung onEdit (dialog). */
  editPath?: string;
  onCreate?: () => void;
  onEdit?: (row: T) => void;
  columns: DataTableColumn<T>[];
  filters?: ListFilter[];
  defaultSort: string;
  /** Module khong co trang thai xuat ban (danh muc) → an loc trang thai & nut publish. */
  publishable?: boolean;
  extraActions?: (row: T) => ReactNode;
}

/** Danh sach noi dung chuan (muc 21, 66): tim, loc, sap xep, phan trang, chon nhieu, thung rac. */
export function ContentListPage<T extends { id: string; status?: ContentStatus }>({
  resource, permission, title, description, label, editPath, onCreate, onEdit, columns, filters = [], defaultSort,
  publishable = true, extraActions,
}: ContentListPageProps<T>) {
  const list = useListParams({ sort: defaultSort });
  const trash = list.filters.trash === 'true';
  const query: Record<string, string | number | undefined> = {
    q: list.q, page: list.page, pageSize: list.pageSize, sort: list.sort, ...list.filters,
  };
  const data = useContentList<T>(resource, query);
  const m = useContentMutations(resource);
  const confirm = useConfirm();
  const navigate = useNavigate();
  const can = {
    create: usePermission(`${permission}.create`),
    update: usePermission(`${permission}.update`),
    delete: usePermission(`${permission}.delete`),
    publish: usePermission(`${permission}.publish`),
  };

  const edit = (row: T) => (onEdit ? onEdit(row) : navigate(`${editPath}/${row.id}`));

  const runBulk = async (action: 'publish' | 'unpublish' | 'delete' | 'restore', ids: string[], clear: () => void) => {
    if (action === 'delete' && !(await confirm({ title: `Chuyển ${ids.length} ${label} vào thùng rác?`, confirmLabel: 'Xoá' }))) return;
    try {
      const result = await m.bulk.mutateAsync({ action, ids });
      if (result.failed.length === 0) toast.success(`Đã xử lý ${result.succeeded} ${label}.`);
      else toast.warning(`Thành công ${result.succeeded}, lỗi ${result.failed.length}: ${result.failed.map((f) => f.message).join(' · ')}`, { duration: 10000 });
      clear();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const actionColumn: DataTableColumn<T> = {
    id: '__actions', header: '', alwaysVisible: true, className: 'w-px whitespace-nowrap text-right',
    cell: (row) => trash ? (
      can.delete && <IconButton label="Khôi phục" icon={<RotateCcw className="size-4" />} onClick={async () => {
        try {
          await m.restore.mutateAsync(row.id);
          toast.success('Đã khôi phục.');
        } catch (error) {
          toast.error(errorMessage(error));
        }
      }} />
    ) : (
      <div className="flex justify-end gap-0.5">
        {extraActions?.(row)}
        <IconButton label="Sửa" icon={<Pencil className="size-4" />} onClick={() => edit(row)} />
        {can.create && editPath && (
          <IconButton label="Nhân bản" icon={<Copy className="size-4" />} onClick={async () => {
            try {
              const copy = await m.duplicate.mutateAsync(row.id);
              toast.success('Đã nhân bản (bản nháp).');
              navigate(`${editPath}/${copy.meta.id}`);
            } catch (error) {
              toast.error(errorMessage(error));
            }
          }} />
        )}
        {can.delete && (
          <IconButton label="Xoá" className="text-danger" icon={<Trash2 className="size-4" />} onClick={async () => {
            if (!(await confirm({ title: `Chuyển ${label} vào thùng rác?`, confirmLabel: 'Xoá' }))) return;
            try {
              await m.remove.mutateAsync(row.id);
              toast.success('Đã chuyển vào thùng rác.');
            } catch (error) {
              toast.error(errorMessage(error));
            }
          }} />
        )}
      </div>
    ),
  };

  return (
    <>
      <PageHeader title={title} description={description} actions={can.create && (
        onCreate ? <Button icon={<Plus className="size-4" />} onClick={onCreate}>Thêm {label}</Button>
          : <Link to={`${editPath}/new`}><Button icon={<Plus className="size-4" />}>Thêm {label}</Button></Link>
      )} />

      <DataTable<T>
        tableId={resource}
        columns={[...columns, actionColumn]}
        data={data.data}
        isLoading={data.isLoading}
        error={data.error}
        onRetry={() => void data.refetch()}
        getRowId={(r) => r.id}
        sort={list.sort}
        onSortChange={list.setSort}
        onPageChange={list.setPage}
        onPageSizeChange={list.setPageSize}
        emptyTitle={trash ? 'Thùng rác trống' : list.q || Object.keys(list.filters).length ? `Không có ${label} phù hợp` : `Chưa có ${label}`}
        bulkActions={(ids, clear) => trash ? (
          can.delete && <Button size="sm" variant="secondary" icon={<RotateCcw className="size-4" />} onClick={() => runBulk('restore', ids, clear)}>Khôi phục</Button>
        ) : (
          <>
            {publishable && can.publish && (
              <>
                <Button size="sm" variant="secondary" icon={<Send className="size-4" />} onClick={() => runBulk('publish', ids, clear)}>Xuất bản</Button>
                <Button size="sm" variant="secondary" icon={<EyeOff className="size-4" />} onClick={() => runBulk('unpublish', ids, clear)}>Gỡ xuất bản</Button>
              </>
            )}
            {can.delete && <Button size="sm" variant="secondary" className="text-danger" icon={<Trash2 className="size-4" />} onClick={() => runBulk('delete', ids, clear)}>Xoá</Button>}
          </>
        )}
        toolbar={
          <>
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-muted" />
              <Input aria-label={`Tìm ${label}`} placeholder="Tìm kiếm…" className="h-9 pl-9" value={list.search}
                onChange={(e) => list.setSearch(e.target.value)} />
            </div>
            {publishable && (
              <Select aria-label="Trạng thái" className="h-9 w-auto" value={list.filters.status ?? ''}
                onChange={(e) => list.setFilter('status', e.target.value)}>
                <option value="">Mọi trạng thái</option>
                {(Object.keys(ContentStatusLabels) as ContentStatus[]).map((s) => <option key={s} value={s}>{ContentStatusLabels[s]}</option>)}
              </Select>
            )}
            {filters.map((f) => (
              <Select key={f.key} aria-label={f.label} className="h-9 w-auto max-w-52" value={list.filters[f.key] ?? ''}
                onChange={(e) => list.setFilter(f.key, e.target.value)}>
                <option value="">{f.label}: tất cả</option>
                {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            ))}
            <Checkbox className="ml-1 text-[13px]" label="Thùng rác" checked={trash}
              onChange={(e) => list.setFilter('trash', e.target.checked ? 'true' : null)} />
          </>
        }
      />
    </>
  );
}

export function TitleCell({ title, subtitle, to }: { title: string; subtitle?: ReactNode; to?: string }) {
  return (
    <div className="min-w-0">
      {to ? <Link to={to} className="font-medium hover:text-primary">{title}</Link> : <p className="font-medium">{title}</p>}
      {subtitle && <p className="truncate text-[13px] text-fg-muted">{subtitle}</p>}
    </div>
  );
}
