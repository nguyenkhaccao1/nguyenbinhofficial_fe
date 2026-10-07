import { Link, Outlet } from 'react-router';
import { useSiteSettings } from '~/root';

export default function SiteLayout() {
  const settings = useSiteSettings();
  const brand = settings?.brand;
  const contact = settings?.contact;
  const ctaHref = contact?.email ? `mailto:${contact.email}` : contact?.phone ? `tel:${contact.phone.replace(/\s/g, '')}` : null;

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded focus:bg-white focus:px-4 focus:py-2">
        Bỏ qua tới nội dung
      </a>
      <header className="sticky top-0 z-40 border-b border-border/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5 font-semibold tracking-tight" aria-label={brand?.siteName ?? 'Trang chủ'}>
            {brand?.logo?.url ? (
              <img src={brand.logo.url} alt={brand.siteName} className="h-8 w-auto" width={brand.logo.width ?? undefined}
                height={brand.logo.height ?? undefined} />
            ) : (
              <>
                <span className="grid size-8 place-items-center rounded-md bg-dark text-xs font-bold text-white">NB</span>
                <span>{brand?.siteName ?? 'Nguyên Bình'}</span>
              </>
            )}
          </Link>
          {ctaHref && (
            <a href={ctaHref} className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-white hover:opacity-90">
              Trao đổi dự án
            </a>
          )}
        </div>
      </header>

      <main id="main">
        <Outlet />
      </main>

      <footer className="bg-dark text-white/70">
        <div className="mx-auto grid max-w-[1280px] gap-10 px-4 py-16 sm:px-6 md:grid-cols-[2fr_1fr] lg:px-8">
          <div>
            <p className="text-lg font-semibold text-white">{brand?.siteName}</p>
            {brand?.tagline && <p className="mt-3 max-w-md leading-relaxed">{brand.tagline}</p>}
          </div>
          {contact && (contact.phone || contact.email || contact.address) && (
            <address className="space-y-2 not-italic">
              <p className="text-sm font-semibold tracking-wider text-white uppercase">Liên hệ</p>
              {contact.phone && <p><a className="hover:text-white" href={`tel:${contact.phone.replace(/\s/g, '')}`}>{contact.phone}</a></p>}
              {contact.email && <p><a className="hover:text-white" href={`mailto:${contact.email}`}>{contact.email}</a></p>}
              {contact.address && <p>{contact.address}</p>}
            </address>
          )}
        </div>
        <div className="border-t border-white/10">
          <p className="mx-auto max-w-[1280px] px-4 py-6 text-sm text-white/50 sm:px-6 lg:px-8">
            © {new Date().getFullYear()} {brand?.legalName ?? brand?.siteName}
          </p>
        </div>
      </footer>
    </>
  );
}
