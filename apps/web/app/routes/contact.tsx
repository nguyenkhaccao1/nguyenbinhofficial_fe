import { ApiError } from '@nb/shared';
import { ContactPanel, PageRenderer } from '~/components/blocks';
import { Breadcrumbs } from '~/components/PageHeader';
import { Container } from '~/components/ui';
import { cacheHeaders, getPage } from '~/lib/api.server';
import { buildMeta, customSchema } from '~/lib/seo';
import { useSiteSettings } from '~/root';
import type { Route } from './+types/contact';

/** /lien-he: trang Page builder neu da tao; chua co → kenh lien he tu Settings. */
export async function loader() {
  const page = await getPage('/lien-he').catch((error) => {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  });
  return { page };
}

export const headers = () => cacheHeaders;

export const meta: Route.MetaFunction = ({ matches, loaderData }) => [
  ...buildMeta({ matches, path: '/lien-he', title: loaderData?.page?.title ?? 'Liên hệ', seo: loaderData?.page?.seo,
    description: 'Liên hệ Nguyên Bình để trao đổi về dự án phần mềm, website, ứng dụng hoặc yêu cầu demo sản phẩm.' }),
  ...customSchema(loaderData?.page?.seo),
];

export default function Contact({ loaderData }: Route.ComponentProps) {
  const settings = useSiteSettings();
  if (loaderData.page) return <PageRenderer page={loaderData.page} />;
  return (
    <Container className="py-12 sm:py-16 lg:py-20">
      <Breadcrumbs items={[{ name: 'Trang chủ', path: '/' }, { name: 'Liên hệ', path: '/lien-he' }]} />
      <div className="mt-10"><ContactPanel settings={settings} as="h1" /></div>
    </Container>
  );
}
