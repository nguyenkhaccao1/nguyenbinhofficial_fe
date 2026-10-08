import type { PublicSeo, PublicSettings } from '@nb/shared';
import type { MetaDescriptor } from 'react-router';

interface RootData {
  settings: PublicSettings | null;
  indexable: boolean;
}

/** Lay loader data cua root tu meta matches. */
export function rootData(matches: readonly ({ id: string; loaderData?: unknown } | undefined)[]): RootData {
  const root = matches.find((m) => m?.id === 'root')?.loaderData as RootData | undefined;
  return root ?? { settings: null, indexable: false };
}

function absolute(url: string | null | undefined, siteUrl: string) {
  if (!url) return null;
  return /^https?:\/\//.test(url) ? url : `${siteUrl}${url.startsWith('/') ? '' : '/'}${url}`;
}

/**
 * Meta day du cho 1 trang (muc 27–28): title theo mau, description, canonical, robots, OpenGraph, Twitter Card.
 * Uu tien SEO nhap trong CMS → du lieu noi dung → SEO mac dinh trong Settings.
 */
export function buildMeta(options: {
  matches: readonly ({ id: string; loaderData?: unknown } | undefined)[];
  path: string;
  title?: string | null;
  description?: string | null;
  image?: string | null;
  seo?: PublicSeo | null;
  type?: 'website' | 'article' | 'product';
  noindex?: boolean;
  /** Trang chu: khong ghep mau tieu de. */
  rawTitle?: boolean;
}): MetaDescriptor[] {
  const { settings, indexable } = rootData(options.matches);
  const siteUrl = settings?.seo.siteUrl ?? 'https://nguyenbinhofficial.com.vn';
  const siteName = settings?.brand.siteName ?? 'Nguyên Bình';
  const seo = options.seo;

  const baseTitle = seo?.title ?? options.title ?? settings?.seo.defaultTitle ?? siteName;
  const title = options.rawTitle || seo?.title ? baseTitle : (settings?.seo.titleTemplate ?? '%s').replace('%s', baseTitle);
  const description = seo?.description ?? options.description ?? settings?.seo.defaultDescription ?? undefined;
  const canonical = seo?.canonicalUrl ?? `${siteUrl}${options.path === '/' ? '/' : options.path.replace(/\/$/, '')}`;
  const image = absolute(seo?.ogImage ?? options.image ?? settings?.seo.defaultOgImage?.url, siteUrl);
  // Moi truong khong index: root.tsx da them noindex cho moi trang → khong lap the robots.
  const robots = !indexable ? null : options.noindex ? 'noindex, follow' : seo?.robots?.replace(',', ', ') ?? null;

  const meta: MetaDescriptor[] = [
    { title },
    { tagName: 'link', rel: 'canonical', href: canonical },
    { property: 'og:type', content: options.type ?? 'website' },
    { property: 'og:site_name', content: siteName },
    { property: 'og:title', content: seo?.ogTitle ?? title },
    { property: 'og:url', content: canonical },
    { property: 'og:locale', content: 'vi_VN' },
    { name: 'twitter:card', content: image ? 'summary_large_image' : 'summary' },
  ];
  if (description) {
    meta.push({ name: 'description', content: description });
    meta.push({ property: 'og:description', content: seo?.ogDescription ?? description });
  }
  if (image) meta.push({ property: 'og:image', content: image });
  if (seo?.twitterImage ?? image) meta.push({ name: 'twitter:image', content: absolute(seo?.twitterImage, siteUrl) ?? image! });
  if (settings?.seo.twitterHandle) meta.push({ name: 'twitter:site', content: settings.seo.twitterHandle });
  if (robots) meta.push({ name: 'robots', content: robots });
  return meta;
}

/** JSON-LD (muc 28). Schema ghi de tu CMS duoc uu tien. */
export function jsonLd(value: unknown): MetaDescriptor {
  return { 'script:ld+json': value as Record<string, unknown> };
}

export function breadcrumbLd(siteUrl: string, items: { name: string; path: string }[]): MetaDescriptor {
  return jsonLd({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({ '@type': 'ListItem', position: i + 1, name: item.name, item: `${siteUrl}${item.path}` })),
  });
}

export function customSchema(seo: PublicSeo | null | undefined): MetaDescriptor[] {
  if (!seo?.schemaJson) return [];
  try {
    return [jsonLd(JSON.parse(seo.schemaJson))];
  } catch {
    return [];
  }
}
