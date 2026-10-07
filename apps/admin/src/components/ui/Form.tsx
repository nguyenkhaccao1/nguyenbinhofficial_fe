import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes,
  type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

const control =
  'w-full rounded-md border border-border bg-white px-3 text-sm text-fg placeholder:text-fg-muted/70 ' +
  'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 disabled:bg-bg-subtle ' +
  'aria-[invalid=true]:border-danger aria-[invalid=true]:focus:ring-danger/15';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => <input ref={ref} className={cn(control, 'h-10', className)} {...props} />,
);
Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, rows = 3, ...props }, ref) => (
    <textarea ref={ref} rows={rows} className={cn(control, 'py-2 leading-6', className)} {...props} />
  ),
);
Textarea.displayName = 'Textarea';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select ref={ref} className={cn(control, 'h-10 pr-8', className)} {...props}>
      {children}
    </select>
  ),
);
Select.displayName = 'Select';

export const Checkbox = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { label?: ReactNode }>(
  ({ className, label, id, ...props }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    return (
      <label htmlFor={inputId} className={cn('inline-flex cursor-pointer items-center gap-2 select-none', className)}>
        <input ref={ref} id={inputId} type="checkbox" className="size-4 rounded-sm accent-primary" {...props} />
        {label && <span>{label}</span>}
      </label>
    );
  },
);
Checkbox.displayName = 'Checkbox';

interface FieldProps {
  label: ReactNode;
  error?: string;
  hint?: ReactNode;
  required?: boolean;
  className?: string;
  /** Render-prop nhan id + aria props de gan vao control. */
  children: (props: { id: string; 'aria-invalid': boolean; 'aria-describedby'?: string }) => ReactNode;
}

/** Nhan + control + loi/goi y, gan aria-describedby dung chuan a11y. */
export function Field({ label, error, hint, required, className, children }: FieldProps) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-[13px] font-medium text-fg">
        {label}
        {required && <span className="ml-0.5 text-danger" aria-hidden>*</span>}
      </label>
      {children({ id, 'aria-invalid': !!error, 'aria-describedby': describedBy })}
      {error ? (
        <p id={`${id}-error`} className="text-[13px] text-danger" role="alert">{error}</p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-[13px] text-fg-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export function FormSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="grid gap-6 border-b border-border py-6 last:border-b-0 lg:grid-cols-[260px_1fr]">
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        {description && <p className="mt-1 text-[13px] leading-5 text-fg-muted">{description}</p>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}
