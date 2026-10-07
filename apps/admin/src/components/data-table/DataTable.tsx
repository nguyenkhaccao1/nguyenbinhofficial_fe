import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
  type VisibilityState,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ChevronsUpDown, Columns3, Inbox } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import type { PagedResult } from '@nb/shared';
import { Button } from '@/components/ui/Button';
import { Card, EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';
import { Checkbox } from '@/components/ui/Form';
import { Pagination } from '@/components/ui/Navigation';
import { cn } from '@/lib/cn';

export interface DataTableColumn<T> {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  /** Ten cot sort gui len API (?sort=name / -name). Khong co → khong sort duoc. */
  sortKey?: string;
  className?: string;
  /** Khong cho an cot (vd cot ten, cot thao tac). */
  alwaysVisible?: boolean;
  defaultHidden?: boolean;
}

interface DataTableProps<T> {
  /** Khoa luu tuy chon an/hien cot trong localStorage. */
  tableId: string;
  columns: DataTableColumn<T>[];
  data: PagedResult<T> | undefined;
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
  getRowId: (row: T) => string;
  sort?: string;
  onSortChange?: (sort: string) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  toolbar?: ReactNode;
  /** Bat chon nhieu dong; render thanh thao tac hang loat khi co dong duoc chon. */
  bulkActions?: (selectedIds: string[], clear: () => void) => ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
}

function loadVisibility(tableId: string, columns: DataTableColumn<unknown>[]): VisibilityState {
  try {
    const saved = localStorage.getItem(`nb-table:${tableId}`);
    if (saved) return JSON.parse(saved) as VisibilityState;
  } catch {
    // localStorage bi chan → dung mac dinh
  }
  return Object.fromEntries(columns.filter((c) => c.defaultHidden).map((c) => [c.id, false]));
}

export function DataTable<T>({ tableId, columns, data, isLoading, error, onRetry, getRowId, sort, onSortChange,
  onPageChange, onPageSizeChange, toolbar, bulkActions, emptyTitle = 'Chưa có dữ liệu', emptyDescription,
  emptyAction }: DataTableProps<T>) {
  const [visibility, setVisibility] = useState<VisibilityState>(() =>
    loadVisibility(tableId, columns as DataTableColumn<unknown>[]));
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [showColumns, setShowColumns] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(`nb-table:${tableId}`, JSON.stringify(visibility));
    } catch {
      // bo qua
    }
  }, [tableId, visibility]);

  // Doi trang/bo loc → bo chon de khong thao tac nham len dong khong con hien thi.
  useEffect(() => setRowSelection({}), [data]);

  const columnDefs: ColumnDef<T>[] = [
    ...(bulkActions
      ? [{
          id: '__select',
          header: ({ table }) => (
            <Checkbox aria-label="Chọn tất cả" checked={table.getIsAllRowsSelected()}
              onChange={table.getToggleAllRowsSelectedHandler()} />
          ),
          cell: ({ row }) => (
            <Checkbox aria-label="Chọn dòng" checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()} />
          ),
        } satisfies ColumnDef<T>]
      : []),
    ...columns.map((c): ColumnDef<T> => ({ id: c.id, header: c.header, cell: ({ row }) => c.cell(row.original) })),
  ];

  const table = useReactTable({
    data: data?.items ?? [],
    columns: columnDefs,
    getRowId,
    state: { columnVisibility: visibility, rowSelection },
    onColumnVisibilityChange: setVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
  });

  const selectedIds = Object.keys(rowSelection).filter((id) => rowSelection[id]);
  const sortState = (key?: string) => (!key || !sort ? null : sort === key ? 'asc' : sort === `-${key}` ? 'desc' : null);

  const toggleSort = (key: string) => {
    const current = sortState(key);
    onSortChange?.(current === 'asc' ? `-${key}` : current === 'desc' ? '' : key);
  };

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
        <div className="flex flex-1 flex-wrap items-center gap-2">{toolbar}</div>
        <div className="relative">
          <Button variant="secondary" size="sm" icon={<Columns3 className="size-4" />}
            aria-expanded={showColumns} onClick={() => setShowColumns((v) => !v)}>
            Cột
          </Button>
          {showColumns && (
            <div className="absolute right-0 z-20 mt-1 w-56 rounded-md border border-border bg-white p-2 shadow-lg">
              {columns.filter((c) => !c.alwaysVisible).map((c) => (
                <Checkbox key={c.id} className="flex w-full rounded px-2 py-1.5 hover:bg-bg-subtle" label={c.header}
                  checked={table.getColumn(c.id)?.getIsVisible() ?? true}
                  onChange={(e) => table.getColumn(c.id)?.toggleVisibility(e.target.checked)} />
              ))}
            </div>
          )}
        </div>
      </div>

      {bulkActions && selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-primary-soft px-4 py-2">
          <span className="text-[13px] font-medium text-primary">Đã chọn {selectedIds.length}</span>
          {bulkActions(selectedIds, () => setRowSelection({}))}
        </div>
      )}

      {error ? (
        <ErrorState error={error} onRetry={onRetry} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              {table.getHeaderGroups().map((group) => (
                <tr key={group.id} className="border-b border-border bg-bg-subtle/60">
                  {group.headers.map((header) => {
                    const meta = columns.find((c) => c.id === header.column.id);
                    const state = sortState(meta?.sortKey);
                    return (
                      <th key={header.id} scope="col"
                        aria-sort={state === 'asc' ? 'ascending' : state === 'desc' ? 'descending' : undefined}
                        className={cn('h-10 px-4 text-xs font-medium tracking-wide text-fg-muted uppercase',
                          header.column.id === '__select' && 'w-10', meta?.className)}>
                        {meta?.sortKey && onSortChange ? (
                          <button type="button" className="inline-flex items-center gap-1 uppercase hover:text-fg"
                            onClick={() => toggleSort(meta.sortKey!)}>
                            {meta.header}
                            {state === 'asc' ? <ArrowUp className="size-3.5" /> : state === 'desc'
                              ? <ArrowDown className="size-3.5" /> : <ChevronsUpDown className="size-3.5 opacity-50" />}
                          </button>
                        ) : (
                          flexRender(header.column.columnDef.header, header.getContext())
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 6 }, (_, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      {table.getVisibleLeafColumns().map((c) => (
                        <td key={c.id} className="h-12 px-4"><Skeleton className="h-4 w-full max-w-40" /></td>
                      ))}
                    </tr>
                  ))
                : table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className={cn('border-b border-border last:border-0 hover:bg-bg-subtle/50',
                      row.getIsSelected() && 'bg-primary-soft/50')}>
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className={cn('h-12 px-4 align-middle',
                          columns.find((c) => c.id === cell.column.id)?.className)}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
            </tbody>
          </table>
          {!isLoading && data?.items.length === 0 && (
            <EmptyState icon={<Inbox />} title={emptyTitle} description={emptyDescription} action={emptyAction} />
          )}
        </div>
      )}

      {data && data.totalItems > 0 && (
        <div className="border-t border-border">
          <Pagination page={data.page} pageSize={data.pageSize} totalPages={data.totalPages} totalItems={data.totalItems}
            onPageChange={onPageChange} onPageSizeChange={onPageSizeChange} />
        </div>
      )}
    </Card>
  );
}
