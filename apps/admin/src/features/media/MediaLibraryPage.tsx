import { Folder, FolderOpen, FolderPlus, Image as ImageIcon, Pencil, Search, Trash2, Upload } from 'lucide-react';
import { useMemo, useRef, useState, type DragEvent } from 'react';
import { ApiError, Permissions } from '@nb/shared';
import { toast } from 'sonner';
import { Can } from '@/auth/guards';
import { Button, IconButton } from '@/components/ui/Button';
import { useConfirm } from '@/components/ui/Dialog';
import { Card, EmptyState, ErrorState, PageHeader, Skeleton } from '@/components/ui/Feedback';
import { Input, Select } from '@/components/ui/Form';
import { Pagination } from '@/components/ui/Navigation';
import { cn } from '@/lib/cn';
import { errorMessage } from '@/lib/forms';
import { useListParams } from '@/lib/useListParams';
import { ACCEPTED_EXTENSIONS, useMediaFolders, useMediaList, useMediaMutations, type MediaFolder } from './api';
import { MediaDetailPanel } from './MediaDetailPanel';
import { MediaGrid } from './MediaGrid';
import { useUpload } from './useUpload';

const ROOT = 'root';

export function MediaLibraryPage() {
  const list = useListParams({ pageSize: 48, sort: '-createdAt' });
  const folderParam = list.filters.folder ?? '';
  const folderId = folderParam && folderParam !== ROOT ? folderParam : null;

  const media = useMediaList({
    q: list.q, page: list.page, pageSize: list.pageSize, sort: list.sort,
    kind: list.filters.kind, folderId, rootOnly: folderParam === ROOT ? true : undefined,
  });
  const folders = useMediaFolders();
  const { bulk } = useMediaMutations();
  const { upload, isUploading } = useUpload();
  const confirm = useConfirm();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const onDrop = async (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) await upload(e.dataTransfer.files, folderId);
  };

  const bulkDelete = async (force = false) => {
    try {
      await bulk.mutateAsync({ action: 'delete', ids: selected, force });
      toast.success(`Đã xoá ${selected.length} file.`);
      setSelected([]);
      setActiveId(null);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409 && !force) {
        if (await confirm({ title: 'Có file đang được sử dụng', description: `${error.message} Các vị trí đang dùng sẽ mất hình ảnh.`, confirmLabel: 'Vẫn xoá' }))
          await bulkDelete(true);
      } else {
        toast.error(errorMessage(error));
      }
    }
  };

  return (
    <>
      <PageHeader
        title="Thư viện media"
        description="Ảnh được tự động tối ưu sang WebP/AVIF nhiều kích thước. Không thể xoá file đang được sử dụng nếu chưa xác nhận."
        actions={
          <Can permission={Permissions.media.upload}>
            <input ref={fileInput} type="file" multiple hidden accept={ACCEPTED_EXTENSIONS.join(',')}
              onChange={async (e) => {
                if (e.target.files?.length) await upload(e.target.files, folderId);
                e.target.value = '';
              }} />
            <Button icon={<Upload className="size-4" />} loading={isUploading} onClick={() => fileInput.current?.click()}>
              Tải lên
            </Button>
          </Can>
        }
      />

      <div className={cn('grid gap-4', activeId ? 'xl:grid-cols-[220px_1fr_340px]' : 'lg:grid-cols-[220px_1fr]')}>
        <FolderPanel folders={folders.data ?? []} loading={folders.isLoading} current={folderParam}
          onSelect={(id) => {
            list.setFilter('folder', id);
            setSelected([]);
          }} />

        <div
          className="relative min-w-0"
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false);
          }}
          onDrop={onDrop}
        >
          <Card className="mb-3 flex flex-wrap items-center gap-2 p-3">
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-muted" />
              <Input aria-label="Tìm media" placeholder="Tìm theo tên, tiêu đề, alt…" className="h-9 pl-9"
                value={list.search} onChange={(e) => list.setSearch(e.target.value)} />
            </div>
            <Select aria-label="Loại file" className="h-9 w-auto" value={list.filters.kind ?? ''}
              onChange={(e) => list.setFilter('kind', e.target.value)}>
              <option value="">Mọi loại</option>
              <option value="IMAGE">Hình ảnh</option>
              <option value="VIDEO">Video</option>
              <option value="DOCUMENT">Tài liệu</option>
            </Select>
            {selected.length > 0 && (
              <div className="ml-auto flex flex-wrap items-center gap-2">
                <span className="text-[13px] font-medium text-primary">Đã chọn {selected.length}</span>
                <Can permission={Permissions.media.update}>
                  <Select aria-label="Chuyển tới thư mục" className="h-8 w-auto" value=""
                    onChange={async (e) => {
                      const target = e.target.value;
                      if (!target) return;
                      try {
                        await bulk.mutateAsync({ action: 'move', ids: selected, folderId: target === ROOT ? null : target });
                        toast.success('Đã chuyển thư mục.');
                        setSelected([]);
                      } catch (error) {
                        toast.error(errorMessage(error));
                      }
                    }}>
                    <option value="">Chuyển tới…</option>
                    <option value={ROOT}>(Thư mục gốc)</option>
                    {folders.data?.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </Select>
                </Can>
                <Can permission={Permissions.media.delete}>
                  <Button variant="secondary" size="sm" className="text-danger" icon={<Trash2 className="size-4" />}
                    onClick={async () => {
                      if (await confirm({ title: `Xoá ${selected.length} file?`, confirmLabel: 'Xoá' })) await bulkDelete();
                    }}>Xoá</Button>
                </Can>
                <Button variant="ghost" size="sm" onClick={() => setSelected([])}>Bỏ chọn</Button>
              </div>
            )}
          </Card>

          {dragging && (
            <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center rounded-lg border-2 border-dashed border-primary bg-primary-soft/80">
              <p className="font-medium text-primary">Thả file để tải lên</p>
            </div>
          )}

          {media.error ? (
            <Card><ErrorState error={media.error} onRetry={() => void media.refetch()} /></Card>
          ) : media.isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
              {Array.from({ length: 12 }, (_, i) => <Skeleton key={i} className="aspect-[4/3.6]" />)}
            </div>
          ) : media.data?.items.length === 0 ? (
            <Card>
              <EmptyState icon={<ImageIcon />}
                title={list.q || list.filters.kind ? 'Không có file phù hợp' : 'Thư mục trống'}
                description="Kéo thả file vào đây hoặc bấm Tải lên. Hỗ trợ ảnh, video MP4/WebM, PDF và tài liệu Office." />
            </Card>
          ) : (
            <>
              <MediaGrid items={media.data?.items ?? []} selectedIds={selected} activeId={activeId}
                onToggleSelect={(id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))}
                onOpen={(m) => setActiveId(m.id)} />
              {media.data && media.data.totalPages > 1 && (
                <Card className="mt-3">
                  <Pagination page={media.data.page} pageSize={media.data.pageSize} totalPages={media.data.totalPages}
                    totalItems={media.data.totalItems} onPageChange={list.setPage} />
                </Card>
              )}
            </>
          )}
        </div>

        {activeId && (
          <div className="xl:sticky xl:top-20 xl:h-[calc(100vh-7rem)]">
            <MediaDetailPanel id={activeId} folders={folders.data ?? []} onClose={() => setActiveId(null)} />
          </div>
        )}
      </div>
    </>
  );
}

interface TreeNode extends MediaFolder {
  children: TreeNode[];
}

function buildTree(folders: MediaFolder[]): TreeNode[] {
  const nodes = new Map(folders.map((f) => [f.id, { ...f, children: [] as TreeNode[] }]));
  const roots: TreeNode[] = [];
  for (const node of nodes.values()) {
    const parent = node.parentId ? nodes.get(node.parentId) : undefined;
    (parent ? parent.children : roots).push(node);
  }
  return roots;
}

function FolderPanel({ folders, loading, current, onSelect }: {
  folders: MediaFolder[]; loading: boolean; current: string; onSelect: (id: string) => void;
}) {
  const tree = useMemo(() => buildTree(folders), [folders]);
  const { createFolder, updateFolder, deleteFolder } = useMediaMutations();
  const confirm = useConfirm();
  const [editing, setEditing] = useState<{ id: string | null; name: string; parentId: string | null } | null>(null);

  const save = async () => {
    if (!editing?.name.trim()) return;
    try {
      if (editing.id) await updateFolder.mutateAsync({ id: editing.id, name: editing.name.trim(), parentId: editing.parentId });
      else await createFolder.mutateAsync({ name: editing.name.trim(), parentId: editing.parentId });
      setEditing(null);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const item = (id: string, label: string, count?: number, depth = 0, node?: TreeNode) => {
    const active = current === id;
    return (
      <div className={cn('group flex items-center rounded-md', active ? 'bg-primary-soft text-primary' : 'hover:bg-bg-subtle')}
        style={{ paddingLeft: depth * 12 }}>
        <button type="button" onClick={() => onSelect(id)} aria-current={active || undefined}
          className="flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5 text-left">
          {active ? <FolderOpen className="size-4 shrink-0" /> : <Folder className="size-4 shrink-0 text-fg-muted" />}
          <span className="truncate">{label}</span>
          {count !== undefined && <span className="ml-auto text-xs text-fg-muted">{count}</span>}
        </button>
        {node && (
          <Can permission={Permissions.media.update}>
            <div className="hidden gap-0.5 pr-1 group-focus-within:flex group-hover:flex">
              <IconButton label="Thư mục con" className="size-6 w-6" icon={<FolderPlus className="size-3.5" />}
                onClick={() => setEditing({ id: null, name: '', parentId: node.id })} />
              <IconButton label="Đổi tên" className="size-6 w-6" icon={<Pencil className="size-3.5" />}
                onClick={() => setEditing({ id: node.id, name: node.name, parentId: node.parentId })} />
              <IconButton label="Xoá thư mục" className="size-6 w-6 text-danger" icon={<Trash2 className="size-3.5" />}
                onClick={async () => {
                  if (!(await confirm({ title: `Xoá thư mục "${node.name}"?`, description: 'Chỉ xoá được thư mục rỗng.', confirmLabel: 'Xoá' }))) return;
                  try {
                    await deleteFolder.mutateAsync(node.id);
                    if (current === node.id) onSelect('');
                  } catch (error) {
                    toast.error(errorMessage(error));
                  }
                }} />
            </div>
          </Can>
        )}
      </div>
    );
  };

  const renderNodes = (nodes: TreeNode[], depth: number) => nodes.map((n) => (
    <li key={n.id}>
      {item(n.id, n.name, n.fileCount, depth, n)}
      {n.children.length > 0 && <ul>{renderNodes(n.children, depth + 1)}</ul>}
    </li>
  ));

  return (
    <Card className="h-fit p-2">
      <div className="mb-1 flex items-center justify-between px-2 py-1">
        <h2 className="text-xs font-semibold tracking-wider text-fg-muted uppercase">Thư mục</h2>
        <Can permission={Permissions.media.update}>
          <IconButton label="Thêm thư mục" icon={<FolderPlus className="size-4" />}
            onClick={() => setEditing({ id: null, name: '', parentId: null })} />
        </Can>
      </div>
      {editing && (
        <form className="mb-2 flex gap-1 px-1" onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}>
          <Input autoFocus aria-label="Tên thư mục" placeholder="Tên thư mục" className="h-8" value={editing.name}
            onChange={(e) => setEditing({ ...editing, name: e.target.value })}
            onKeyDown={(e) => e.key === 'Escape' && setEditing(null)} />
          <Button type="submit" size="sm" loading={createFolder.isPending || updateFolder.isPending}>Lưu</Button>
        </form>
      )}
      <nav aria-label="Thư mục media">
        <ul className="text-[13px]">
          <li>{item('', 'Tất cả file')}</li>
          <li>{item(ROOT, '(Thư mục gốc)')}</li>
          {loading ? <li className="p-2"><Skeleton className="h-4" /></li> : renderNodes(tree, 0)}
        </ul>
      </nav>
    </Card>
  );
}
