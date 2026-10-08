import { Link } from 'react-router';
import type { Navigation, NavItem, NavMegaItem, PublicSettings } from '@nb/shared';

type FooterLink = { label: string; url: string; external?: boolean };

function fromNav(items: NavItem[] | undefined): FooterLink[] {
  return (items ?? []).filter((i) => i.url).map((i) => ({ label: i.label, url: i.url!, external: i.openInNewTab }));
}

function fromMega(items: NavMegaItem[] | undefined, limit = 8): FooterLink[] {
  return (items ?? []).slice(0, limit).map((i) => ({ label: i.label, url: i.url }));
}

function Column({ title, links }: { title: string; links: FooterLink[] }) {
  if (links.length === 0) return null;
  return (
    <div>
      <p className="text-sm font-semibold tracking-wider text-white uppercase">{title}</p>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.url + l.label}>
            {/^(https?:|mailto:|tel:)/.test(l.url) || l.external
              ? <a href={l.url} className="hover:text-white" target="_blank" rel="noopener noreferrer">{l.label}</a>
              : <Link to={l.url} className="hover:text-white">{l.label}</Link>}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Footer: cot San pham/Dich vu/Giai phap tu du lieu da xuat ban; Cong ty/Cong nghe/Phap ly tu menu CMS. */
export function SiteFooter({ settings, navigation }: { settings: PublicSettings | null; navigation: Navigation | null }) {
  const brand = settings?.brand;
  const contact = settings?.contact;
  const social = settings?.social;
  const socials = [
    ['Facebook', social?.facebook], ['LinkedIn', social?.linkedIn], ['YouTube', social?.youTube], ['TikTok', social?.tikTok],
    ['GitHub', social?.gitHub], ['X', social?.x], ['Zalo', contact?.zaloUrl],
  ].filter(([, url]) => url) as [string, string][];

  return (
    <footer className="bg-dark text-white/65">
      <div className="mx-auto grid max-w-[1280px] gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.4fr_3fr] lg:px-8 lg:py-20">
        <div>
          <p className="text-lg font-semibold text-white">{brand?.siteName ?? 'Nguyên Bình'}</p>
          {brand?.tagline && <p className="mt-3 max-w-sm leading-relaxed">{brand.tagline}</p>}
          {contact && (contact.phone || contact.email || contact.address) && (
            <address className="mt-6 space-y-2 not-italic">
              {(contact.hotline ?? contact.phone) && (
                <p><a className="hover:text-white" href={`tel:${(contact.hotline ?? contact.phone)!.replace(/\s/g, '')}`}>{contact.hotline ?? contact.phone}</a></p>
              )}
              {contact.email && <p><a className="hover:text-white" href={`mailto:${contact.email}`}>{contact.email}</a></p>}
              {contact.address && <p>{contact.address}</p>}
              {contact.workingHours && <p className="text-sm text-white/45">{contact.workingHours}</p>}
            </address>
          )}
          {socials.length > 0 && (
            <ul className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-sm">
              {socials.map(([name, url]) => <li key={name}><a href={url} target="_blank" rel="noopener noreferrer" className="hover:text-white">{name}</a></li>)}
            </ul>
          )}
        </div>
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
          <Column title="Sản phẩm" links={fromMega(navigation?.products)} />
          <Column title="Dịch vụ" links={fromMega(navigation?.services)} />
          <Column title="Giải pháp" links={fromMega(navigation?.solutions)} />
          <Column title="Công ty" links={fromNav(navigation?.footerCompany)} />
          <Column title="Công nghệ" links={fromNav(navigation?.footerTechnology)} />
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-3 px-4 py-6 text-sm text-white/45 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>
            © {new Date().getFullYear()} {brand?.legalName ?? brand?.siteName}
            {contact?.taxCode && <> · MST {contact.taxCode}</>}
          </p>
          {fromNav(navigation?.footerLegal).length > 0 && (
            <ul className="flex flex-wrap gap-x-5 gap-y-2">
              {fromNav(navigation?.footerLegal).map((l) => <li key={l.url}><Link to={l.url} className="hover:text-white">{l.label}</Link></li>)}
            </ul>
          )}
        </div>
      </div>
    </footer>
  );
}
