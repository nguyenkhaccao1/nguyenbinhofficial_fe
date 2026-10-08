import { data } from 'react-router';
import {
  ApiError, requestJson, type BlogCategory, type BlogResolveResult, type IndustryCard, type Navigation, type PagedResult,
  type PostCard, type ProductCard, type ProductDetail, type ProjectCard, type ProjectDetail, type PublicPage,
  type PublicSettings, type QueryValue, type RequestOptions, type SearchResult, type ServiceDetail, type ServiceGroup,
  type TechnologyGroupDto,
} from '@nb/shared';

/**
 * Goi API tu server SSR qua mang noi bo (khong di qua internet/CDN).
 * INTERNAL_API_URL: vd http://nguyenbinh-api:8080 trong docker, http://localhost:5080 khi dev.
 */
const INTERNAL_API_URL = (process.env.INTERNAL_API_URL ?? 'http://localhost:5080').replace(/\/$/, '');

export function apiGet<T>(path: string, query?: Record<string, QueryValue>, options: RequestOptions = {}) {
  return requestJson<T>(`${INTERNAL_API_URL}/api/v1`, path, { ...options, query, method: 'GET' });
}

/** API tra 404 → route tra 404 that (ErrorBoundary hien trang 404), khong phai soft-404. */
export async function orNotFound<T>(promise: Promise<T>): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) throw data(null, { status: 404 });
    throw error;
  }
}

/** Cache ngan trong process cho du lieu dung o moi trang (settings, menu), giam goi API lap lai. */
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

export const getSiteSettings = () => cached('settings', 60_000, () => apiGet<PublicSettings>('/site/settings'));
export const getNavigation = () => cached('navigation', 60_000, () => apiGet<Navigation>('/site/navigation'));

export const getPage = (path: string) => apiGet<PublicPage>('/pages/by-path', { path });
export const getProjects = (query: Record<string, QueryValue>) => apiGet<PagedResult<ProjectCard>>('/projects', query);
export const getProject = (slug: string) => apiGet<ProjectDetail>(`/projects/${encodeURIComponent(slug)}`);
export const getProducts = () => apiGet<ProductCard[]>('/products');
export const getProduct = (slug: string) => apiGet<ProductDetail>(`/products/${encodeURIComponent(slug)}`);
export const getServices = () => apiGet<ServiceGroup[]>('/services');
export const getService = (slug: string) => apiGet<ServiceDetail>(`/services/${encodeURIComponent(slug)}`);
export const getIndustries = () => apiGet<IndustryCard[]>('/industries');
export const getTechnologies = () => apiGet<TechnologyGroupDto[]>('/technologies');
export const getPosts = (query: Record<string, QueryValue>) => apiGet<PagedResult<PostCard>>('/blog/posts', query);
export const getBlogCategories = () => apiGet<BlogCategory[]>('/blog/categories');
export const resolveBlog = (slug: string) => apiGet<BlogResolveResult>(`/blog/resolve/${encodeURIComponent(slug)}`);
export const search = (q: string) => apiGet<SearchResult>('/search', { q });
export const getSitemap = () => apiGet<{ path: string; lastModified: string | null; kind: string }[]>('/site/sitemap');

/** Chi index o production that (SITE_INDEXABLE=true); SIT/UAT/dev luon noindex (SEO architecture). */
export const SITE_INDEXABLE = process.env.SITE_INDEXABLE === 'true';

/** Header cache cho CDN: HTML tuoi trong 5 phut, phuc vu ban cu khi dang lam moi. */
export const cacheHeaders = { 'Cache-Control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400' };
