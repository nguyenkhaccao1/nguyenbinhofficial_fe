import { getSiteSettings, getSitemap, SITE_INDEXABLE } from '~/lib/api.server';

const priority: Record<string, string> = {
  home: '1.0', listing: '0.8', product: '0.9', service: '0.8', project: '0.7', page: '0.6', post: '0.6', category: '0.5',
};

const xml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** /sitemap.xml — moi URL cong khai (API /site/sitemap da loai noi dung nhap va noindex). */
export async function loader() {
  if (!SITE_INDEXABLE) return new Response('Not found', { status: 404 });
  const [entries, settings] = await Promise.all([getSitemap(), getSiteSettings().catch(() => null)]);
  const siteUrl = settings?.seo.siteUrl ?? 'https://nguyenbinhofficial.com.vn';
  const urls = entries.map((e) => [
    '  <url>',
    `    <loc>${xml(siteUrl + (e.path === '/' ? '/' : e.path))}</loc>`,
    e.lastModified ? `    <lastmod>${e.lastModified.slice(0, 10)}</lastmod>` : null,
    `    <priority>${priority[e.kind] ?? '0.5'}</priority>`,
    '  </url>',
  ].filter(Boolean).join('\n'));
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=0, s-maxage=3600' },
  });
}
