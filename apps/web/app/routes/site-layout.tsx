import { Outlet } from 'react-router';
import { SiteFooter } from '~/components/SiteFooter';
import { SiteHeader } from '~/components/SiteHeader';
import { getNavigation } from '~/lib/api.server';
import { useSiteSettings } from '~/root';
import type { Route } from './+types/site-layout';

export async function loader() {
  // Menu loi → van render trang (header chi con logo + CTA), khong lam sap ca website.
  return { navigation: await getNavigation().catch(() => null) };
}

export default function SiteLayout({ loaderData }: Route.ComponentProps) {
  const settings = useSiteSettings();
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded focus:bg-white focus:px-4 focus:py-2">
        Bỏ qua tới nội dung
      </a>
      <SiteHeader settings={settings} navigation={loaderData.navigation} />
      <main id="main">
        <Outlet />
      </main>
      <SiteFooter settings={settings} navigation={loaderData.navigation} />
    </>
  );
}
