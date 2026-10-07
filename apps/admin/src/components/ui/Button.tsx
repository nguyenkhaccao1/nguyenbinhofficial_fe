import { LoaderCircle } from 'lucide-react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md';

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-hover disabled:bg-primary/50',
  secondary: 'bg-white text-fg border border-border hover:bg-bg-subtle disabled:text-fg-muted',
  ghost: 'text-fg hover:bg-bg-subtle disabled:text-fg-muted',
  danger: 'bg-danger text-white hover:bg-danger/90 disabled:bg-danger/50',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
}

export function Button({ variant = 'primary', size = 'md', loading, icon, className, children, disabled,
  type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-md font-medium whitespace-nowrap transition-colors disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
}

export function IconButton({ label, className, ...props }: ButtonProps & { label: string }) {
  return (
    <Button variant="ghost" size="sm" aria-label={label} title={label} className={cn('w-8 px-0', className)} {...props} />
  );
}
