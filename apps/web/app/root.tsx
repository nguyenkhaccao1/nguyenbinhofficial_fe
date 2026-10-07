import '@fontsource-variable/inter';
import './app.css';
import type { CSSProperties, ReactNode } from 'react';
import {
  data,
  isRouteErrorResponse,
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteLoaderData,
} from 'react-router';
import type { PublicSettings } from '@nb/shared';
import { getSiteSettings, SITE_INDEXABLE } from '~/lib/api.server';
import type { Route } from './+types/root';

export async function loader() {
  // Settings la du lieu nen cua moi trang; neu API loi van render duoc khung trang (khong trang trang).
  const settings = await getSiteSettings().catch(() => null);
  return data({ settings, indexable: SITE_INDEXABLE });
}

export function useSiteSettings() {
  return useRouteLoaderData<typeof loader>('root')?.settings ?? null;
}

export const links: Route.LinksFunction = () => [];

function themeStyle(settings: PublicSettings | null): CSSProperties | undefined {
  if (!settings) return undefined;
  return {
    '--brand-primary': settings.theme.primaryColor,
    '--brand-accent': settings.theme.accentColor,
    '--brand-dark': settings.theme.darkColor,
  } as CSSProperties;
}

export function Layout({ children }: { children: ReactNode }) {
  const root = useRouteLoaderData<typeof loader>('root');
  const settings = root?.settings ?? null;
  const tracking = settings?.tracking;

  return (
    <html lang="vi" style={themeStyle(settings)}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {!root?.indexable && <meta name="robots" content="noindex, nofollow" />}
        {tracking?.googleSiteVerification && <meta name="google-site-verification" content={tracking.googleSiteVerification} />}
        {tracking?.bingSiteVerification && <meta name="msvalidate.01" content={tracking.bingSiteVerification} />}
        {settings?.brand.favicon?.url && <link rel="icon" href={settings.brand.favicon.url} />}
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const notFound = isRouteErrorResponse(error) && error.status === 404;
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-3xl flex-col justify-center px-4 py-24 sm:px-6">
      <p className="font-mono text-sm text-fg-muted">{notFound ? '404' : 'Lỗi'}</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
        {notFound ? 'Không tìm thấy trang' : 'Đã có lỗi xảy ra'}
      </h1>
      <p className="mt-4 max-w-xl text-lg text-fg-muted">
        {notFound
          ? 'Trang bạn tìm có thể đã được chuyển hoặc không còn tồn tại.'
          : 'Chúng tôi đang khắc phục. Vui lòng thử lại sau ít phút.'}
      </p>
      <Link to="/" className="mt-8 inline-flex h-12 w-fit items-center rounded-md bg-primary px-6 font-medium text-white hover:opacity-90">
        Về trang chủ
      </Link>
    </main>
  );
}
