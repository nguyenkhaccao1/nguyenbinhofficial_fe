import { ArrowLeft, CalendarClock, Copy, Eye, EyeOff, History, MoreHorizontal, RotateCcw, Save, Send, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { FormProvider, useForm, type DefaultValues, type FieldValues, type UseFormReturn } from 'react-hook-form';
import { Link, useBlocker, useNavigate } from 'react-router';
import { ApiError, ContentStatusLabels, formatDateTime, type ContentDetail, type ContentStatus } from '@nb/shared';
import { toast } from 'sonner';
import { usePermission } from '@/auth/session';
import { Button } from '@/components/ui/Button';
import { Dialog, useConfirm } from '@/components/ui/Dialog';
import { Badge, ErrorState, Skeleton, Spinner } from '@/components/ui/Feedback';
import { Field, Input } from '@/components/ui/Form';
import { useContentDetail, useContentMutations, useContentVersions } from '@/lib/content';
import { applyServerErrors, errorMessage } from '@/lib/forms';

const statusTone: Record<ContentStatus, 'neutral' | 'success' | 'warning' | 'primary' | 'danger'> = {
  DRAFT: 'neutral',
  SCHEDULED: 'primary',
  PUBLISHED: 'success',
  UNPUBLISHED: 'warning',
  ARCHIVED: 'neutral',
};

export function StatusBadge({ status }: { status: ContentStatus }) {
  return <Badge tone={statusTone[status]}>{ContentStatusLabels[status]}</Badge>;
}

export interface ContentEditorConfig<T> {
  resource: string;
  /** Module quyen (project, product, blog...) de an/hien nut. */
  permission: string;
  label: string;
  listPath: string;
  empty: T;
  /** Tu dong luu nhap (Blog/Page builder — muc 67). */
  autosave?: boolean;
}

/** Trang thai + thao tac cua man hinh soan noi dung. */
export function useContentEditor<T extends FieldValues>(config: ContentEditorConfig<T>, id: string | undefined) {
  const detail = useContentDetail<T>(config.resource, id);
  const mutations = useContentMutations<T>(config.resource);
  const form = useForm<T>({ defaultValues: config.empty as DefaultValues<T> });
  const loadedVersion = useRef<string | null>(null);

  // Nap du lieu khi tai xong / sau khi luu (rowVersion doi) — khong ghi de khi dang sua do dong bo nen.
  useEffect(() => {
    const data = detail.data;
    if (!data || data.meta.rowVersion === loadedVersion.current) return;
    loadedVersion.current = data.meta.rowVersion;
    form.reset({ ...config.empty, ...data.data } as T);
  }, [detail.data, form, config.empty]);

  return { config, id, isNew: !id, detail, mutations, form };
}

type Editor<T extends FieldValues> = ReturnType<typeof useContentEditor<T>>;

/** Khung man hinh soan: tieu de, trang thai, thao tac, canh bao roi trang, xung dot sua dong thoi. */
export function ContentEditorShell<T extends FieldValues>({ editor, title, children, onBeforeSave }: {
  editor: Editor<T>;
  title: string;
  children: ReactNode;
  /** Chuan hoa du lieu form truoc khi gui (vd bo dong trong). */
  onBeforeSave?: (data: T) => T;
}) {
  const { config, id, isNew, detail, mutations, form } = editor;
  const navigate = useNavigate();
  const confirm = useConfirm();
  const canCreate = usePermission(`${config.permission}.create`);
  const canUpdate = usePermission(`${config.permission}.update`);
  const canPublish = usePermission(`${config.permission}.publish`);
  const canDelete = usePermission(`${config.permission}.delete`);
  const [scheduling, setScheduling] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [autosavedAt, setAutosavedAt] = useState<string | null>(null);
  const isDirty = form.formState.isDirty;
  const meta = detail.data?.meta;
  const canEdit = isNew ? canCreate : canUpdate;

  // Canh bao khi roi trang voi thay doi chua luu (muc 67).
  const blocker = useBlocker(({ currentLocation, nextLocation }) =>
    isDirty && !form.formState.isSubmitting && currentLocation.pathname !== nextLocation.pathname);
  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    void confirm({ title: 'Rời trang khi chưa lưu?', description: 'Các thay đổi chưa lưu sẽ bị mất.', confirmLabel: 'Rời trang' })
      .then((ok) => (ok ? blocker.proceed() : blocker.reset()));
  }, [blocker, confirm]);
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  // Tu luu nhap moi 30 giay khi co thay doi (khong doi noi dung da luu).
  const autosave = mutations.autosave;
  useEffect(() => {
    if (!config.autosave || isNew || !isDirty || !id) return;
    const timer = setInterval(() => {
      autosave.mutate({ id, data: prepare(form.getValues()) },
        { onSuccess: () => setAutosavedAt(new Date().toISOString()) });
    }, 30_000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.autosave, isNew, isDirty, id]);

  const prepare = useCallback((data: T) => (onBeforeSave ? onBeforeSave(data) : data), [onBeforeSave]);

  const save = form.handleSubmit(async (data) => {
    try {
      if (isNew) {
        const created = await mutations.create.mutateAsync(prepare(data));
        form.reset(created.data as T);
        toast.success(`Đã tạo ${config.label}.`);
        navigate(`${config.listPath}/${created.meta.id}`, { replace: true });
      } else {
        await saveExisting(data, meta?.rowVersion);
      }
    } catch (error) {
      applyServerErrors(error, form.setError);
    }
  });

  const saveExisting = async (data: T, rowVersion: string | undefined) => {
    try {
      const updated = await mutations.update.mutateAsync({ id: id!, data: prepare(data), rowVersion });
      form.reset(updated.data as T);
      toast.success('Đã lưu.');
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        const overwrite = await confirm({
          title: 'Nội dung đã bị người khác thay đổi',
          description: 'Ghi đè sẽ thay thế thay đổi của người kia bằng nội dung bạn đang soạn. Huỷ để giữ form và tải lại sau.',
          confirmLabel: 'Ghi đè',
        });
        if (overwrite) await saveExisting(data, undefined);
        return;
      }
      throw error;
    }
  };

  const runAction = async (action: () => Promise<ContentDetail<T>>, success: string) => {
    if (isDirty) {
      toast.warning('Hãy lưu thay đổi trước.');
      return;
    }
    try {
      await action();
      toast.success(success);
    } catch (error) {
      // 422 khi xuat ban: hien loi tren tung truong con thieu.
      if (error instanceof ApiError && error.isValidation) {
        applyServerErrors(error, form.setError);
        toast.error(error.message);
      } else {
        toast.error(errorMessage(error));
      }
    }
  };

  if (!isNew && detail.error) return <ErrorState error={detail.error} onRetry={() => void detail.refetch()} />;
  if (!isNew && !detail.data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <FormProvider {...form}>
    <form onSubmit={save} noValidate>
      <div className="sticky top-14 z-10 -mx-4 mb-6 border-b border-border bg-bg-subtle/95 px-4 py-3 backdrop-blur lg:-mx-8 lg:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <Link to={config.listPath} className="grid size-8 place-items-center rounded-md hover:bg-white" aria-label="Quay lại danh sách">
            <ArrowLeft className="size-4" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-semibold tracking-tight">{title || (isNew ? `Thêm ${config.label}` : '—')}</h1>
            <p className="flex flex-wrap items-center gap-2 text-xs text-fg-muted">
              {meta ? <StatusBadge status={meta.status} /> : <Badge>Chưa lưu</Badge>}
              {meta?.status === 'SCHEDULED' && meta.publishAt && <span>Xuất bản lúc {formatDateTime(meta.publishAt)}</span>}
              {meta?.updatedAt && <span>Cập nhật {formatDateTime(meta.updatedAt)}</span>}
              {isDirty && <span className="text-warning">• Có thay đổi chưa lưu</span>}
              {autosavedAt && <span>• Đã tự lưu nháp {formatDateTime(autosavedAt)}</span>}
              {autosave.isPending && <Spinner className="size-3" label="Đang tự lưu" />}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!isNew && meta && canPublish && (meta.status === 'PUBLISHED' || meta.status === 'SCHEDULED' ? (
              <Button variant="secondary" icon={<EyeOff className="size-4" />} loading={mutations.unpublish.isPending}
                onClick={() => runAction(() => mutations.unpublish.mutateAsync(id!), 'Đã gỡ xuất bản.')}>Gỡ xuất bản</Button>
            ) : (
              <>
                <Button variant="secondary" icon={<CalendarClock className="size-4" />} onClick={() => setScheduling(true)}>Lên lịch</Button>
                <Button variant="secondary" icon={<Send className="size-4" />} loading={mutations.publish.isPending}
                  onClick={() => runAction(() => mutations.publish.mutateAsync(id!), 'Đã xuất bản.')}>Xuất bản</Button>
              </>
            ))}
            {canEdit && (
              <Button type="submit" icon={<Save className="size-4" />} loading={form.formState.isSubmitting}
                disabled={!isNew && !isDirty}>{isNew ? 'Tạo' : 'Lưu'}</Button>
            )}
            {!isNew && (
              <div className="relative">
                <Button variant="ghost" aria-label="Thao tác khác" aria-expanded={moreOpen}
                  icon={<MoreHorizontal className="size-4" />} onClick={() => setMoreOpen((v) => !v)} />
                {moreOpen && (
                  <div role="menu" className="absolute right-0 z-20 mt-1 w-56 rounded-md border border-border bg-white p-1 shadow-lg"
                    onMouseLeave={() => setMoreOpen(false)}>
                    <MenuItem icon={<History />} onClick={() => { setShowVersions(true); setMoreOpen(false); }}>Lịch sử phiên bản</MenuItem>
                    {canCreate && (
                      <MenuItem icon={<Copy />} onClick={async () => {
                        setMoreOpen(false);
                        try {
                          const copy = await mutations.duplicate.mutateAsync(id!);
                          toast.success('Đã nhân bản (bản nháp).');
                          navigate(`${config.listPath}/${copy.meta.id}`);
                        } catch (error) {
                          toast.error(errorMessage(error));
                        }
                      }}>Nhân bản</MenuItem>
                    )}
                    {canDelete && (
                      <MenuItem icon={<Trash2 />} danger onClick={async () => {
                        setMoreOpen(false);
                        if (!(await confirm({ title: `Chuyển ${config.label} vào thùng rác?`, description: 'Có thể khôi phục trong thùng rác.', confirmLabel: 'Xoá' }))) return;
                        try {
                          await mutations.remove.mutateAsync(id!);
                          form.reset(form.getValues());
                          toast.success('Đã chuyển vào thùng rác.');
                          navigate(config.listPath);
                        } catch (error) {
                          toast.error(errorMessage(error));
                        }
                      }}>Xoá</MenuItem>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {meta?.isDeleted && (
        <p className="mb-4 rounded-md bg-warning-soft px-3 py-2 text-[13px] text-warning">
          Nội dung đang ở thùng rác — khôi phục từ danh sách (bộ lọc “Thùng rác”) để sử dụng lại.
        </p>
      )}

      <fieldset disabled={!canEdit} className="min-w-0">{children}</fieldset>

      {scheduling && id && (
        <ScheduleDialog onClose={() => setScheduling(false)} onSubmit={async (publishAt) => {
          setScheduling(false);
          await runAction(() => mutations.schedule.mutateAsync({ id, publishAt }), 'Đã lên lịch xuất bản.');
        }} />
      )}
      {showVersions && id && (
        <VersionsDialog resource={config.resource} id={id} canRestore={canUpdate} onClose={() => setShowVersions(false)}
          onRestore={async (versionId) => {
            if (isDirty && !(await confirm({ title: 'Bỏ thay đổi chưa lưu?', description: 'Khôi phục phiên bản sẽ thay thế nội dung đang soạn.', confirmLabel: 'Khôi phục' }))) return;
            try {
              const restored = await mutations.restoreVersion.mutateAsync({ id, versionId });
              form.reset(restored.data as T);
              setShowVersions(false);
              toast.success('Đã khôi phục phiên bản.');
            } catch (error) {
              toast.error(errorMessage(error));
            }
          }} />
      )}
    </form>
    </FormProvider>
  );
}

function MenuItem({ icon, children, onClick, danger }: { icon: ReactNode; children: ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button type="button" role="menuitem" onClick={onClick}
      className={`flex w-full items-center gap-2 rounded px-3 py-2 text-left hover:bg-bg-subtle [&>svg]:size-4 ${danger ? 'text-danger' : ''}`}>
      {icon}{children}
    </button>
  );
}

function ScheduleDialog({ onClose, onSubmit }: { onClose: () => void; onSubmit: (iso: string) => void }) {
  const tomorrow = new Date(Date.now() + 24 * 3600 * 1000);
  tomorrow.setMinutes(0, 0, 0);
  const local = new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  const [value, setValue] = useState(local);
  const valid = !!value && new Date(value).getTime() > Date.now();

  return (
    <Dialog open onClose={onClose} size="sm" title="Lên lịch xuất bản"
      footer={<><Button variant="secondary" onClick={onClose}>Huỷ</Button>
        <Button disabled={!valid} onClick={() => onSubmit(new Date(value).toISOString())}>Lên lịch</Button></>}>
      <Field label="Thời điểm xuất bản" hint="Theo giờ của máy bạn. Nội dung tự hiển thị trên website khi tới giờ."
        error={value && !valid ? 'Chọn thời điểm trong tương lai.' : undefined}>
        {(p) => <Input type="datetime-local" {...p} value={value} onChange={(e) => setValue(e.target.value)} />}
      </Field>
    </Dialog>
  );
}

function VersionsDialog({ resource, id, canRestore, onClose, onRestore }: {
  resource: string; id: string; canRestore: boolean; onClose: () => void; onRestore: (versionId: string) => void;
}) {
  const versions = useContentVersions(resource, id, true);
  return (
    <Dialog open onClose={onClose} title="Lịch sử phiên bản" description="Mỗi lần lưu, xuất bản hoặc tự lưu nháp đều tạo một phiên bản.">
      {versions.error ? <ErrorState error={versions.error} onRetry={() => void versions.refetch()} />
        : !versions.data ? <div className="grid place-items-center py-8"><Spinner /></div> : (
          <ul className="divide-y divide-border">
            {versions.data.map((v) => (
              <li key={v.id} className="flex items-center gap-3 py-2.5 text-[13px]">
                <span className="w-10 font-mono text-fg-muted">v{v.version}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{v.note ?? 'Lưu'} {v.isAutosave && <Badge>Tự lưu</Badge>}</p>
                  <p className="text-xs text-fg-muted">{formatDateTime(v.createdAt)} · {v.createdByName ?? 'Hệ thống'}</p>
                </div>
                {canRestore && (
                  <Button variant="secondary" size="sm" icon={<RotateCcw className="size-3.5" />} onClick={() => onRestore(v.id)}>
                    Khôi phục
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
    </Dialog>
  );
}

/** Nhom truong trong form soan (tieu de trai, noi dung phai — muc 66 "form chia section ro rang"). */
export function EditorSection({ title, description, children }: { title: string; description?: ReactNode; children: ReactNode }) {
  return (
    <section className="grid gap-6 border-b border-border py-6 first:pt-0 last:border-b-0 lg:grid-cols-[240px_1fr]">
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        {description && <div className="mt-1 text-[13px] leading-5 text-fg-muted">{description}</div>}
      </div>
      <div className="grid min-w-0 gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export function PublicLink({ path }: { path: string }) {
  return (
    <a href={path} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[13px] text-primary hover:underline">
      <Eye className="size-3.5" /> {path}
    </a>
  );
}

/** register(...) cho o chon id / ngay: chuoi rong → null (backend nhan Guid?/DateOnly?). */
export const nullable = { setValueAs: (v: unknown) => (v === '' || v === undefined ? null : v) };

export type { UseFormReturn };
