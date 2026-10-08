import { ApiError } from '@nb/shared';
import { PageRenderer } from '~/components/blocks';
import { CardGrid, IndustryCardView } from '~/components/cards';
import { PageHeader } from '~/components/PageHeader';
import { Container } from '~/components/ui';
import { cacheHeaders, getIndustries, getPage } from '~/lib/api.server';
import { breadcrumbLd, buildMeta, customSchema, rootData } from '~/lib/seo';
import type { Route } from './+types/solutions';

/** /giai-phap: uu tien trang Page builder cung duong dan; chua co → danh sach nganh tu CMS. */
export async function loader() {
  const page = await getPage('/giai-phap').catch((error) => {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  });
  return { page, industries: page ? [] : await getIndustries() };
}

export const headers = () => cacheHeaders;

export const meta: Route.MetaFunction = ({ matches, loaderData }) => [
  ...buildMeta({ matches, path: '/giai-phap', title: loaderData?.page?.title ?? 'Giải pháp theo ngành', seo: loaderData?.page?.seo,
    description: 'Giải pháp phần mềm cho nhà hàng, khách sạn, bán lẻ, nhân sự và doanh nghiệp.' }),
  breadcrumbLd(rootData(matches).settings?.seo.siteUrl ?? '', [{ name: 'Trang chủ', path: '/' }, { name: 'Giải pháp', path: '/giai-phap' }]),
  ...customSchema(loaderData?.page?.seo),
];

export default function Solutions({ loaderData }: Route.ComponentProps) {
  if (loaderData.page) return <PageRenderer page={loaderData.page} />;
  return (
    <>
      <PageHeader crumbs={[{ name: 'Trang chủ', path: '/' }, { name: 'Giải pháp', path: '/giai-phap' }]}
        title="Giải pháp theo ngành" subtitle="Phần mềm được thiết kế theo quy trình vận hành đặc thù của từng ngành." />
      <Container className="py-12 sm:py-16">
        {loaderData.industries.length === 0
          ? <p className="text-lg text-fg-muted">Thông tin giải pháp đang được cập nhật.</p>
          : <CardGrid columns={3}>{loaderData.industries.map((i) => <IndustryCardView key={i.id} industry={i} />)}</CardGrid>}
      </Container>
    </>
  );
}
