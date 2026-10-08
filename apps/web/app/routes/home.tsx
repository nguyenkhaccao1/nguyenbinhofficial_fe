import { ApiError } from '@nb/shared';
import { PageRenderer } from '~/components/blocks';
import { ButtonLink, Container } from '~/components/ui';
import { cacheHeaders, getPage } from '~/lib/api.server';
import { buildMeta, customSchema, jsonLd, rootData } from '~/lib/seo';
import { useSiteSettings } from '~/root';
import type { Route } from './+types/home';

/** Trang chu = Page builder (path "/"). Chua xuat ban trang chu → hero toi gian tu Settings (khong noi dung gia). */
export async function loader() {
  const page = await getPage('/').catch((error) => {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  });
  return { page };
}

export const headers = () => cacheHeaders;

export const meta: Route.MetaFunction = ({ loaderData, matches }) => {
  const { settings } = rootData(matches);
  const siteUrl = settings?.seo.siteUrl ?? '';
  return [
    ...buildMeta({ matches, path: '/', seo: loaderData?.page?.seo, rawTitle: true }),
    jsonLd({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: settings?.brand.siteName,
      ...(settings?.brand.legalName ? { legalName: settings.brand.legalName } : {}),
      ...(settings?.contact.taxCode ? { taxID: settings.contact.taxCode } : {}),
      ...(settings?.contact.address
        ? { address: { '@type': 'PostalAddress', streetAddress: settings.contact.address, addressLocality: 'Hà Nội', addressCountry: 'VN' } }
        : {}),
      url: `${siteUrl}/`,
      ...(settings?.brand.logo?.url ? { logo: settings.brand.logo.url } : {}),
      ...(settings?.contact.email ? { email: settings.contact.email } : {}),
      ...(settings?.contact.phone ? { telephone: settings.contact.phone } : {}),
      sameAs: Object.values(settings?.social ?? {}).filter(Boolean),
    }),
    jsonLd({ '@context': 'https://schema.org', '@type': 'WebSite', name: settings?.brand.siteName, url: `${siteUrl}/`,
      potentialAction: { '@type': 'SearchAction', target: `${siteUrl}/search?q={search_term_string}`, 'query-input': 'required name=search_term_string' } }),
    ...customSchema(loaderData?.page?.seo),
  ];
};

export default function Home({ loaderData }: Route.ComponentProps) {
  const settings = useSiteSettings();
  if (loaderData.page) return <PageRenderer page={loaderData.page} />;
  const brand = settings?.brand;
  return (
    <section className="bg-dark text-white tone-dark">
      <Container className="py-24 sm:py-32 lg:py-40">
        <p className="text-sm font-semibold tracking-[0.08em] text-accent uppercase">{brand?.siteName}</p>
        <h1 className="mt-5 max-w-4xl text-4xl leading-[1.08] font-semibold tracking-tight text-balance sm:text-6xl lg:text-display">{brand?.tagline}</h1>
        {brand?.description && <p className="mt-6 max-w-2xl text-lg leading-8 text-white/70 sm:text-xl">{brand.description}</p>}
        <div className="mt-10 flex flex-wrap gap-3">
          <ButtonLink to="/du-an" variant="light" size="lg" arrow>Xem dự án</ButtonLink>
          <ButtonLink to="/lien-he" variant="secondary" size="lg">Trao đổi dự án</ButtonLink>
        </div>
      </Container>
    </section>
  );
}
