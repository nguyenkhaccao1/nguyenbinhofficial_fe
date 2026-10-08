import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Container, Eyebrow } from './ui';

export interface Crumb {
  name: string;
  path: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-fg-muted [.tone-dark_&]:text-white/55">
        {items.map((c, i) => (
          <li key={c.path} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="size-3.5" aria-hidden />}
            {i === items.length - 1 ? <span aria-current="page" className="text-fg [.tone-dark_&]:text-white">{c.name}</span>
              : <Link to={c.path} className="hover:text-fg [.tone-dark_&]:hover:text-white">{c.name}</Link>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** Dau trang cho trang danh sach/chi tiet: breadcrumb + H1 + mo ta. */
export function PageHeader({ crumbs, eyebrow, title, subtitle, children, dark }: {
  crumbs: Crumb[]; eyebrow?: ReactNode; title: ReactNode; subtitle?: ReactNode; children?: ReactNode; dark?: boolean;
}) {
  return (
    <div className={dark ? 'bg-dark text-white tone-dark' : 'border-b border-border bg-bg-subtle'}>
      <Container className="py-12 sm:py-16 lg:py-20">
        <Breadcrumbs items={crumbs} />
        {eyebrow && <Eyebrow className="mt-8">{eyebrow}</Eyebrow>}
        <h1 className="mt-4 max-w-4xl text-4xl leading-[1.1] font-semibold tracking-tight text-balance sm:text-5xl">{title}</h1>
        {subtitle && <p className="mt-5 max-w-3xl text-lg leading-relaxed text-fg-muted sm:text-xl [.tone-dark_&]:text-white/70">{subtitle}</p>}
        {children}
      </Container>
    </div>
  );
}
