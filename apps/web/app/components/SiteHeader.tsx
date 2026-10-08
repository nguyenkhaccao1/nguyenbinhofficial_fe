import { ChevronDown, Menu, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Form, Link, NavLink, useLocation } from 'react-router';
import type { Navigation, NavItem, NavMegaItem, PublicSettings } from '@nb/shared';
import { Icon } from './Icon';
import { cx } from './ui';

function isExternal(url: string) {
  return /^(https?:|mailto:|tel:)/.test(url);
}

function NavAnchor({ item, className, onNavigate }: { item: { label: string; url: string | null; openInNewTab?: boolean }; className?: string; onNavigate?: () => void }) {
  if (!item.url) return <span className={className}>{item.label}</span>;
  if (isExternal(item.url) || item.openInNewTab) {
    return <a href={item.url} className={className} {...(item.openInNewTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{item.label}</a>;
  }
  return <Link to={item.url} prefetch="intent" className={className} onClick={onNavigate}>{item.label}</Link>;
}

/** Muc con cua 1 menu: megamenu tu du lieu (san pham/dich vu/giai phap) hoac children nhap tay. */
function subItems(item: NavItem): NavMegaItem[] {
  if (item.mega.length > 0) return item.mega;
  return item.children.filter((c) => c.url).map((c) => ({ label: c.label, url: c.url!, description: c.description, icon: null }));
}

function MegaPanel({ item, onNavigate }: { item: NavItem; onNavigate: () => void }) {
  const items = subItems(item);
  const wide = items.length > 4;
  return (
    <div className={cx('absolute top-full left-1/2 z-50 -translate-x-1/2 pt-3', wide ? 'w-[min(760px,90vw)]' : 'w-[380px]')}>
      <div className="rounded-xl border border-border bg-white p-3 shadow-[0_24px_60px_-20px_rgba(10,13,20,0.25)]">
        <ul className={cx('grid gap-1', wide && 'sm:grid-cols-2')}>
          {items.map((m) => (
            <li key={m.url}>
              <Link to={m.url} prefetch="intent" onClick={onNavigate} className="flex gap-3 rounded-lg p-3 hover:bg-bg-subtle">
                {m.icon && <Icon name={m.icon} className="mt-0.5 size-5 shrink-0 text-primary" />}
                <span>
                  <span className="block font-medium">{m.label}</span>
                  {m.description && <span className="mt-0.5 line-clamp-2 block text-sm text-fg-muted">{m.description}</span>}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        {item.url && (
          <Link to={item.url} onClick={onNavigate} className="mt-2 block rounded-lg bg-bg-subtle px-3 py-2.5 text-sm font-medium text-primary hover:underline">
            Xem tất cả {item.label.toLowerCase()}
          </Link>
        )}
      </div>
    </div>
  );
}

export function SiteHeader({ settings, navigation }: { settings: PublicSettings | null; navigation: Navigation | null }) {
  const brand = settings?.brand;
  const items = navigation?.header ?? [];
  const [open, setOpen] = useState<string | null>(null);
  const [drawer, setDrawer] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const location = useLocation();

  // Dong menu khi chuyen trang.
  useEffect(() => {
    setOpen(null);
    setDrawer(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!drawer) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDrawer(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [drawer]);

  const enter = (label: string) => {
    clearTimeout(closeTimer.current);
    setOpen(label);
  };
  const leave = () => {
    closeTimer.current = setTimeout(() => setOpen(null), 120);
  };

  const contact = settings?.contact;
  const cta = { label: 'Trao đổi dự án', url: '/lien-he' };

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex shrink-0 items-center gap-2.5 font-semibold tracking-tight" aria-label={brand?.siteName ?? 'Trang chủ'}>
          {brand?.logo?.url ? (
            <img src={brand.logo.url} alt={brand.siteName} className="h-8 w-auto" width={brand.logo.width ?? undefined} height={brand.logo.height ?? undefined} />
          ) : (
            <>
              <span className="grid size-8 place-items-center rounded-md bg-dark text-xs font-bold text-white">NB</span>
              <span>{brand?.siteName ?? 'Nguyên Bình'}</span>
            </>
          )}
        </Link>

        <nav aria-label="Menu chính" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {items.map((item) => {
              const sub = subItems(item);
              if (sub.length === 0) {
                return (
                  <li key={item.label}>
                    {item.url && !isExternal(item.url) && !item.openInNewTab ? (
                      <NavLink to={item.url} prefetch="intent" className={({ isActive }) => cx('rounded-md px-3 py-2 text-[15px] font-medium hover:text-primary', isActive && 'text-primary')}>
                        {item.label}
                      </NavLink>
                    ) : <NavAnchor item={item} className="rounded-md px-3 py-2 text-[15px] font-medium hover:text-primary" />}
                  </li>
                );
              }
              const isOpen = open === item.label;
              return (
                <li key={item.label} className="relative" onMouseEnter={() => enter(item.label)} onMouseLeave={leave}>
                  <button type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : item.label)}
                    className={cx('flex items-center gap-1 rounded-md px-3 py-2 text-[15px] font-medium hover:text-primary', isOpen && 'text-primary')}>
                    {item.label}
                    <ChevronDown className={cx('size-4 transition-transform', isOpen && 'rotate-180')} aria-hidden />
                  </button>
                  {isOpen && <MegaPanel item={item} onNavigate={() => setOpen(null)} />}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <Link to="/search" aria-label="Tìm kiếm" className="grid size-10 place-items-center rounded-md text-fg-muted hover:bg-bg-subtle hover:text-fg">
            <Search className="size-5" aria-hidden />
          </Link>
          <Link to={cta.url} className="hidden h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90 sm:inline-flex">
            {cta.label}
          </Link>
          <button type="button" className="grid size-10 place-items-center rounded-md hover:bg-bg-subtle lg:hidden" aria-label="Mở menu"
            aria-expanded={drawer} onClick={() => setDrawer(true)}>
            <Menu className="size-6" aria-hidden />
          </button>
        </div>
      </div>

      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-dark/40" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col bg-white shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-border px-4">
              <span className="font-semibold">{brand?.siteName ?? 'Nguyên Bình'}</span>
              <button type="button" className="grid size-10 place-items-center rounded-md hover:bg-bg-subtle" aria-label="Đóng menu" onClick={() => setDrawer(false)}>
                <X className="size-6" aria-hidden />
              </button>
            </div>
            <Form action="/search" className="border-b border-border p-4">
              <input type="search" name="q" placeholder="Tìm sản phẩm, dự án, bài viết…" aria-label="Tìm kiếm"
                className="h-11 w-full rounded-md border border-border px-3 outline-none focus:border-primary" />
            </Form>
            <nav aria-label="Menu di động" className="flex-1 overflow-y-auto p-2">
              <ul>
                {items.map((item) => {
                  const sub = subItems(item);
                  const isExpanded = expanded === item.label;
                  return (
                    <li key={item.label} className="border-b border-border/60 last:border-0">
                      {sub.length === 0 ? (
                        <NavAnchor item={item} className="block px-3 py-3.5 text-[17px] font-medium" onNavigate={() => setDrawer(false)} />
                      ) : (
                        <>
                          <button type="button" aria-expanded={isExpanded} onClick={() => setExpanded(isExpanded ? null : item.label)}
                            className="flex w-full items-center justify-between px-3 py-3.5 text-[17px] font-medium">
                            {item.label}
                            <ChevronDown className={cx('size-5 transition-transform', isExpanded && 'rotate-180')} aria-hidden />
                          </button>
                          {isExpanded && (
                            <ul className="pb-2">
                              {item.url && (
                                <li><Link to={item.url} onClick={() => setDrawer(false)} className="block px-6 py-2.5 font-medium text-primary">Tất cả {item.label.toLowerCase()}</Link></li>
                              )}
                              {sub.map((m) => (
                                <li key={m.url}><Link to={m.url} onClick={() => setDrawer(false)} className="block px-6 py-2.5 text-fg-muted hover:text-fg">{m.label}</Link></li>
                              ))}
                            </ul>
                          )}
                        </>
                      )}
                    </li>
                  );
                })}
              </ul>
            </nav>
            <div className="space-y-2 border-t border-border p-4">
              <Link to={cta.url} onClick={() => setDrawer(false)} className="flex h-12 items-center justify-center rounded-md bg-primary font-medium text-white">{cta.label}</Link>
              {contact?.hotline || contact?.phone ? (
                <a href={`tel:${(contact.hotline ?? contact.phone)!.replace(/\s/g, '')}`} className="flex h-12 items-center justify-center rounded-md border border-border font-medium">
                  Gọi {contact.hotline ?? contact.phone}
                </a>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
