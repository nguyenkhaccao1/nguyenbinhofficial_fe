import { KeyRound, Lock, LockOpen, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { formatDateTime, Permissions } from '@nb/shared';
import { toast } from 'sonner';
import { Can } from '@/auth/guards';
import { useSession } from '@/auth/session';
import { DataTable, type DataTableColumn } from '@/components/data-table/DataTable';
import { Button, IconButton } from '@/components/ui/Button';
import { useConfirm } from '@/components/ui/Dialog';
import { Badge, PageHeader } from '@/components/ui/Feedback';
import { Input, Select } from '@/components/ui/Form';
import { errorMessage } from '@/lib/forms';
import { useListParams } from '@/lib/useListParams';
import { useRoles, useUserMutations, useUsers, type UserListItem } from './api';
import { ResetPasswordDialog, UserFormDialog } from './UserDialogs';

export function UsersPage() {
  const list = useListParams({ sort: '-createdAt' });
  const query = {
    q: list.q, page: list.page, pageSize: list.pageSize, sort: list.sort,
    role: list.filters.role, isActive: list.filters.isActive,
  };
  const users = useUsers(query);
  const roles = useRoles();
  const mutations = useUserMutations();
  const confirm = useConfirm();
  const currentUserId = useSession((s) => s.user?.id);

  const [editing, setEditing] = useState<UserListItem | 'new' | null>(null);
  const [resetting, setResetting] = useState<UserListItem | null>(null);

  const run = async (action: Promise<unknown>, success: string) => {
    try {
      await action;
      toast.success(success);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const columns: DataTableColumn<UserListItem>[] = [
    {
      id: 'name', header: 'Người dùng', sortKey: 'fullName', alwaysVisible: true,
      cell: (u) => (
        <div>
          <p className="font-medium">{u.fullName}{u.id === currentUserId && <span className="ml-1.5 text-xs text-fg-muted">(bạn)</span>}</p>
          <p className="text-[13px] text-fg-muted">{u.email}</p>
        </div>
      ),
    },
    {
      id: 'roles', header: 'Vai trò',
      cell: (u) => <div className="flex flex-wrap gap-1">{u.roles.map((r) => <Badge key={r} tone="primary">{r}</Badge>)}</div>,
    },
    {
      id: 'status', header: 'Trạng thái',
      cell: (u) => u.isLockedOut ? <Badge tone="danger">Bị khoá</Badge>
        : u.isActive ? <Badge tone="success">Hoạt động</Badge> : <Badge>Vô hiệu</Badge>,
    },
    { id: 'lastLogin', header: 'Đăng nhập gần nhất', sortKey: 'lastLoginAt', cell: (u) => formatDateTime(u.lastLoginAt) },
    { id: 'created', header: 'Ngày tạo', sortKey: 'createdAt', cell: (u) => formatDateTime(u.createdAt), defaultHidden: true },
    {
      id: 'actions', header: '', alwaysVisible: true, className: 'w-px whitespace-nowrap text-right',
      cell: (u) => (
        <Can permission={Permissions.user.update}>
          <div className="flex justify-end gap-0.5">
            <IconButton label="Sửa" icon={<Pencil className="size-4" />} onClick={() => setEditing(u)} />
            <IconButton label="Đặt lại mật khẩu" icon={<KeyRound className="size-4" />} onClick={() => setResetting(u)} />
            {u.id !== currentUserId && (u.isLockedOut ? (
              <IconButton label="Mở khoá" icon={<LockOpen className="size-4" />}
                onClick={() => run(mutations.unlock.mutateAsync(u.id), 'Đã mở khoá tài khoản.')} />
            ) : (
              <IconButton label="Khoá tài khoản" icon={<Lock className="size-4" />}
                onClick={async () => {
                  if (await confirm({ title: `Khoá tài khoản ${u.email}?`, description: 'Người dùng bị đăng xuất khỏi mọi thiết bị và không thể đăng nhập cho tới khi được mở khoá.', confirmLabel: 'Khoá' }))
                    await run(mutations.lock.mutateAsync(u.id), 'Đã khoá tài khoản.');
                }} />
            ))}
            {u.id !== currentUserId && (
              <Can permission={Permissions.user.delete}>
                <IconButton label="Xoá" className="text-danger" icon={<Trash2 className="size-4" />}
                  onClick={async () => {
                    if (await confirm({ title: `Xoá người dùng ${u.email}?`, description: 'Tài khoản sẽ bị vô hiệu hoá và ẩn khỏi danh sách. Lịch sử thao tác vẫn được giữ trong nhật ký.', confirmLabel: 'Xoá' }))
                      await run(mutations.remove.mutateAsync(u.id), 'Đã xoá người dùng.');
                  }} />
              </Can>
            )}
          </div>
        </Can>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Người dùng"
        description="Tài khoản quản trị và vai trò được gán."
        actions={
          <Can permission={Permissions.user.create}>
            <Button icon={<Plus className="size-4" />} onClick={() => setEditing('new')}>Thêm người dùng</Button>
          </Can>
        }
      />

      <DataTable
        tableId="users"
        columns={columns}
        data={users.data}
        isLoading={users.isLoading}
        error={users.error}
        onRetry={() => void users.refetch()}
        getRowId={(u) => u.id}
        sort={list.sort}
        onSortChange={list.setSort}
        onPageChange={list.setPage}
        onPageSizeChange={list.setPageSize}
        emptyTitle={list.q || list.filters.role ? 'Không có người dùng phù hợp' : 'Chưa có người dùng'}
        toolbar={
          <>
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-muted" />
              <Input aria-label="Tìm người dùng" placeholder="Tìm theo tên hoặc email…" className="h-9 pl-9"
                value={list.search} onChange={(e) => list.setSearch(e.target.value)} />
            </div>
            <Select aria-label="Lọc theo vai trò" className="h-9 w-auto" value={list.filters.role ?? ''}
              onChange={(e) => list.setFilter('role', e.target.value)}>
              <option value="">Tất cả vai trò</option>
              {roles.data?.map((r) => <option key={r.id} value={r.name}>{r.name}</option>)}
            </Select>
            <Select aria-label="Lọc theo trạng thái" className="h-9 w-auto" value={list.filters.isActive ?? ''}
              onChange={(e) => list.setFilter('isActive', e.target.value)}>
              <option value="">Mọi trạng thái</option>
              <option value="true">Hoạt động</option>
              <option value="false">Vô hiệu</option>
            </Select>
          </>
        }
      />

      {editing && (
        <UserFormDialog user={editing === 'new' ? null : editing} roles={roles.data ?? []} onClose={() => setEditing(null)} />
      )}
      {resetting && <ResetPasswordDialog user={resetting} onClose={() => setResetting(null)} />}
    </>
  );
}
