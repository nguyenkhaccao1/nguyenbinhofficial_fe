import { getSiteSettings, SITE_INDEXABLE } from '~/lib/api.server';

/**
 * /robots.txt — production (SITE_INDEXABLE=true): cho phep index noi dung, chan khu quan tri/API/tim kiem, khai bao sitemap.
 * Moi truong khac: chan toan bo (tranh Google index ban thu nghiem).
 */
export async function loader() {
  const headers = { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=0, s-maxage=3600' };
  if (!SITE_INDEXABLE) return new Response('User-agent: *\nDisallow: /\n', { headers });
  const settings = await getSiteSettings().catch(() => null);
  const siteUrl = settings?.seo.siteUrl ?? 'https://nguyenbinhofficial.com.vn';
  const lines = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin/',
    'Disallow: /api/',
    'Disallow: /search',
    settings?.seo.robotsExtra?.trim(),
    '',
    `Sitemap: ${siteUrl}/sitemap.xml`,
    '',
  ].filter((l) => l !== undefined && l !== null);
  return new Response(lines.join('\n'), { headers });
}
