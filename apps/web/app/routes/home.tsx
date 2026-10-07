import type { PublicSettings } from '@nb/shared';
import { useSiteSettings } from '~/root';
import type { Route } from './+types/home';

/**
 * Phase 1: hero lay hoan toan tu Settings (thuong hieu, thong diep) — khong co noi dung cung trong code.
 * Phase 3 thay bang Page builder (Page HOME) voi cac section du an, san pham, dich vu.
 */
export const meta: Route.MetaFunction = ({ matches }) => {
  const settings = (matches[0]?.loaderData as { settings?: PublicSettings | null } | undefined)?.settings;
  const title = settings?.seo.defaultTitle ?? settings?.brand.siteName ?? 'Nguyên Bình';
  const description = settings?.seo.defaultDescription ?? settings?.brand.description ?? undefined;
  return [
    { title },
    ...(description ? [{ name: 'description', content: description }] : []),
    ...(settings?.seo.siteUrl ? [{ tagName: 'link', rel: 'canonical', href: `${settings.seo.siteUrl}/` }] : []),
    { property: 'og:type', content: 'website' },
    { property: 'og:title', content: title },
    ...(description ? [{ property: 'og:description', content: description }] : []),
    ...(settings?.seo.defaultOgImage?.url ? [{ property: 'og:image', content: settings.seo.defaultOgImage.url }] : []),
  ];
};

export function headers() {
  // CDN cache ngan + stale-while-revalidate; noi dung cap nhat tu CMS hien ra sau toi da 5 phut.
  return { 'Cache-Control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400' };
}

export default function Home() {
  const settings = useSiteSettings();
  const brand = settings?.brand;

  return (
    <section className="relative overflow-hidden bg-dark text-white">
      <div className="mx-auto max-w-[1280px] px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
        <p className="text-sm font-semibold tracking-[0.08em] text-accent uppercase">{brand?.siteName}</p>
        <h1 className="mt-5 max-w-4xl text-4xl leading-[1.08] font-semibold tracking-tight text-balance sm:text-6xl lg:text-display">
          {brand?.tagline}
        </h1>
        {brand?.description && (
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/70 sm:text-xl">{brand.description}</p>
        )}
      </div>
    </section>
  );
}
