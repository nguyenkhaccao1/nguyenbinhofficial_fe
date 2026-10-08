import { ArrowRight } from 'lucide-react';
import { type ComponentProps, type CSSProperties, type ElementType, type ReactNode } from 'react';
import { Link } from 'react-router';
import type { PublicImage } from '@nb/shared';

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(' ');
}

export type Tone = 'light' | 'subtle' | 'dark';

const toneClass: Record<Tone, string> = {
  light: 'bg-bg text-fg',
  subtle: 'bg-bg-subtle text-fg',
  dark: 'bg-dark text-white tone-dark',
};

const paddingClass: Record<string, string> = {
  none: 'py-0',
  sm: 'py-10 sm:py-12',
  md: 'py-14 sm:py-20',
  lg: 'py-16 sm:py-24 lg:py-28',
};

const widthClass: Record<string, string> = {
  content: 'max-w-[1280px]',
  wide: 'max-w-[1440px]',
  full: 'max-w-none',
};

export function Container({ children, width = 'content', className }: { children: ReactNode; width?: string; className?: string }) {
  return <div className={cx('mx-auto w-full px-4 sm:px-6 lg:px-8', widthClass[width] ?? widthClass.content, className)}>{children}</div>;
}

export function Section({ tone = 'light', padding = 'lg', width = 'content', id, className, children }: {
  tone?: Tone; padding?: string; width?: string; id?: string; className?: string; children: ReactNode;
}) {
  return (
    <section id={id} className={cx(toneClass[tone] ?? toneClass.light, paddingClass[padding] ?? paddingClass.lg, className)}>
      <Container width={width}>{children}</Container>
    </section>
  );
}

export function Eyebrow({ children, className, ...rest }: ComponentProps<'p'>) {
  return <p {...rest} className={cx('text-[13px] font-semibold tracking-[0.08em] text-primary uppercase [.tone-dark_&]:text-accent', className)}>{children}</p>;
}

export function SectionHeading({ eyebrow, title, subtitle, align = 'left', as: Tag = 'h2', action }: {
  eyebrow?: ReactNode; title?: ReactNode; subtitle?: ReactNode; align?: 'left' | 'center'; as?: ElementType; action?: ReactNode;
}) {
  if (!eyebrow && !title && !subtitle) return null;
  return (
    <div data-anim="heading" className={cx('mb-10 flex flex-wrap items-end justify-between gap-6 sm:mb-14', align === 'center' && 'flex-col items-center text-center')}>
      <div className={cx('max-w-3xl', align === 'center' && 'mx-auto')}>
        {eyebrow && <Eyebrow className="mb-3">{eyebrow}</Eyebrow>}
        {title && <Tag className="text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl lg:text-[2.75rem]">{title}</Tag>}
        {subtitle && <p className="mt-4 text-lg leading-relaxed text-fg-muted [.tone-dark_&]:text-white/65">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

const buttonVariants = {
  primary: 'bg-primary text-white hover:bg-primary/90',
  secondary: 'border border-border bg-white text-fg hover:border-fg/30 [.tone-dark_&]:border-white/20 [.tone-dark_&]:bg-white/5 [.tone-dark_&]:text-white [.tone-dark_&]:hover:bg-white/10',
  light: 'bg-white text-dark hover:bg-white/90',
  link: 'px-0 text-primary hover:underline [.tone-dark_&]:text-accent',
};

export function ButtonLink({ to, children, variant = 'primary', size = 'md', className, arrow }: {
  to: string; children: ReactNode; variant?: keyof typeof buttonVariants; size?: 'md' | 'lg'; className?: string; arrow?: boolean;
}) {
  const external = /^(https?:|mailto:|tel:)/.test(to);
  const classes = cx('inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors',
    variant !== 'link' && (size === 'lg' ? 'h-12 px-6 text-base' : 'h-11 px-5 text-[15px]'), buttonVariants[variant], className);
  const content = <>{children}{arrow && <ArrowRight className="size-4" aria-hidden />}</>;
  if (external) return <a href={to} className={classes} {...(to.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{content}</a>;
  return <Link to={to} className={classes} prefetch="intent">{content}</Link>;
}

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cx('inline-flex items-center rounded-sm border border-border bg-bg-subtle px-2 py-0.5 text-xs font-medium text-fg-muted',
      '[.tone-dark_&]:border-white/15 [.tone-dark_&]:bg-white/5 [.tone-dark_&]:text-white/70', className)}>{children}</span>
  );
}

export function TechChip({ children }: { children: ReactNode }) {
  return <span className="font-mono text-xs text-fg-muted [.tone-dark_&]:text-white/60">{children}</span>;
}

/**
 * Anh responsive: AVIF → WebP → anh goc. Kich thuoc co dinh (tranh CLS), lazy mac dinh;
 * priority=true cho anh LCP (hero).
 */
export function Picture({ image, alt, sizes = '(min-width: 1024px) 50vw, 100vw', className, imgClassName, priority, style, parallax }: {
  image: PublicImage | null | undefined; alt?: string; sizes?: string; className?: string; imgClassName?: string; priority?: boolean;
  style?: CSSProperties;
  /** Anh troi nhe khi cuon (GSAP, xem motion.tsx) — dung trong khung overflow-hidden. */
  parallax?: boolean;
}) {
  if (!image) return null;
  const avif = image.sources.filter((s) => s.format === 'avif');
  const webp = image.sources.filter((s) => s.format === 'webp');
  const srcSet = (list: typeof avif) => list.map((s) => `${s.url} ${s.width}w`).join(', ');
  return (
    <picture className={parallax ? cx('block size-full', className) : className} data-parallax={parallax || undefined}>
      {avif.length > 0 && <source type="image/avif" srcSet={srcSet(avif)} sizes={sizes} />}
      {webp.length > 0 && <source type="image/webp" srcSet={srcSet(webp)} sizes={sizes} />}
      <img src={image.url} alt={alt ?? image.alt ?? ''} width={image.width ?? undefined} height={image.height ?? undefined}
        loading={priority ? 'eager' : 'lazy'} decoding="async" fetchPriority={priority ? 'high' : undefined}
        className={imgClassName} style={{
          ...(image.blurDataUrl ? { backgroundImage: `url(${image.blurDataUrl})`, backgroundSize: 'cover' } : {}), ...style,
        }} />
    </picture>
  );
}

/** Khung trinh duyet mong de trinh bay anh man hinh that (muc 35–36). */
export function BrowserFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cx('overflow-hidden rounded-xl border border-border bg-white shadow-[0_24px_60px_-24px_rgba(10,13,20,0.35)] [.tone-dark_&]:border-white/10', className)}>
      <div className="flex items-center gap-1.5 border-b border-border bg-bg-subtle px-3 py-2 [.tone-dark_&]:border-white/10 [.tone-dark_&]:bg-dark-elevated" aria-hidden>
        <span className="size-2.5 rounded-full bg-fg/15" /><span className="size-2.5 rounded-full bg-fg/15" /><span className="size-2.5 rounded-full bg-fg/15" />
      </div>
      {children}
    </div>
  );
}

export function PhoneFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cx('overflow-hidden rounded-[2rem] border-[6px] border-dark bg-dark shadow-[0_24px_60px_-24px_rgba(10,13,20,0.45)]', className)}>
      <div className="overflow-hidden rounded-[1.5rem] bg-white">{children}</div>
    </div>
  );
}

/** Placeholder trung tinh khi du an chua co/khong duoc cong bo anh (khong dung anh gia — muc 36). */
export function ImagePlaceholder({ label, className }: { label: string; className?: string }) {
  return (
    <div className={cx('grid place-items-center bg-gradient-to-br from-bg-subtle to-border/60 [.tone-dark_&]:from-dark-elevated [.tone-dark_&]:to-white/5', className)}>
      <span className="px-6 text-center text-lg font-semibold tracking-tight text-fg/30 [.tone-dark_&]:text-white/30">{label}</span>
    </div>
  );
}

/** HTML da duoc backend lam sach (HtmlSanitizer) — hien thi voi kieu chu prose. */
export function RichText({ html, className }: { html: string | null | undefined; className?: string }) {
  if (!html) return null;
  return <div className={cx('prose-nb', className)} dangerouslySetInnerHTML={{ __html: html }} />;
}
