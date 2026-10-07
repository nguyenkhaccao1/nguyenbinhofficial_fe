import { X } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { create } from 'zustand';
import { cn } from '@/lib/cn';
import { Button, IconButton } from './Button';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const widths = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' };

/** Dung <dialog> native: co san focus trap, Esc dong, top-layer, aria-modal. */
export function Dialog({ open, onClose, title, description, children, footer, size = 'md' }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose(); // click ra ngoai
      }}
      aria-labelledby="dialog-title"
      className={cn(
        'm-auto w-[calc(100%-2rem)] rounded-lg border border-border bg-white p-0 text-fg shadow-xl backdrop:bg-dark/50',
        widths[size],
      )}
    >
      {open && (
        <div className="flex max-h-[85vh] flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
            <div>
              <h2 id="dialog-title" className="text-base font-semibold">{title}</h2>
              {description && <div className="mt-1 text-[13px] text-fg-muted">{description}</div>}
            </div>
            <IconButton label="Đóng" icon={<X className="size-4" />} onClick={onClose} />
          </div>
          <div className="overflow-y-auto px-5 py-4">{children}</div>
          {footer && <div className="flex justify-end gap-2 border-t border-border px-5 py-3">{footer}</div>}
        </div>
      )}
    </dialog>
  );
}

interface ConfirmOptions {
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  tone?: 'danger' | 'primary';
}

interface ConfirmState {
  request: (ConfirmOptions & { resolve: (ok: boolean) => void }) | null;
  open: (options: ConfirmOptions) => Promise<boolean>;
}

const useConfirmStore = create<ConfirmState>((set) => ({
  request: null,
  open: (options) => new Promise<boolean>((resolve) => set({ request: { ...options, resolve } })),
}));

/** `if (await confirm({...})) ...` — thay cho window.confirm. */
export function useConfirm() {
  return useConfirmStore((s) => s.open);
}

export function ConfirmHost() {
  const request = useConfirmStore((s) => s.request);
  const [busy, setBusy] = useState(false);

  const close = (ok: boolean) => {
    request?.resolve(ok);
    setBusy(false);
    useConfirmStore.setState({ request: null });
  };

  return (
    <Dialog
      open={!!request}
      onClose={() => close(false)}
      title={request?.title ?? ''}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={() => close(false)}>Huỷ</Button>
          <Button
            variant={request?.tone === 'primary' ? 'primary' : 'danger'}
            loading={busy}
            onClick={() => {
              setBusy(true);
              close(true);
            }}
          >
            {request?.confirmLabel ?? 'Xác nhận'}
          </Button>
        </>
      }
    >
      {request?.description && <div className="text-fg-muted">{request.description}</div>}
    </Dialog>
  );
}
