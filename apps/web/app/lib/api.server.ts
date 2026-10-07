import { requestJson, type PublicSettings, type RequestOptions } from '@nb/shared';

/**
 * Goi API tu server SSR qua mang noi bo (khong di qua internet/CDN).
 * INTERNAL_API_URL: vd http://api:8080 trong docker, http://localhost:5080 khi dev.
 */
const INTERNAL_API_URL = (process.env.INTERNAL_API_URL ?? 'http://localhost:5080').replace(/\/$/, '');

export function apiGet<T>(path: string, options: RequestOptions = {}) {
  return requestJson<T>(`${INTERNAL_API_URL}/api/v1`, path, { ...options, method: 'GET' });
}

/** Cache ngan trong process cho du lieu dung o moi trang (settings), giam goi API lap lai. */
const memo = new Map<string, { expires: number; value: Promise<unknown> }>();

function cached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const hit = memo.get(key);
  if (hit && hit.expires > Date.now()) return hit.value as Promise<T>;
  const value = load().catch((error) => {
    memo.delete(key); // khong cache loi
    throw error;
  });
  memo.set(key, { expires: Date.now() + ttlMs, value });
  return value;
}

export function getSiteSettings() {
  return cached('settings', 60_000, () => apiGet<PublicSettings>('/site/settings'));
}

/** Chi index o production that (SITE_INDEXABLE=true); SIT/UAT/dev luon noindex (muc 9 SEO architecture). */
export const SITE_INDEXABLE = process.env.SITE_INDEXABLE === 'true';
