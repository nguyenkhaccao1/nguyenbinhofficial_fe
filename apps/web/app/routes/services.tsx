import { CardGrid, ServiceCardView } from '~/components/cards';
import { PageHeader } from '~/components/PageHeader';
import { Container } from '~/components/ui';
import { cacheHeaders, getServices } from '~/lib/api.server';
import { breadcrumbLd, buildMeta, rootData } from '~/lib/seo';
import type { Route } from './+types/services';

export async function loader() {
  return { groups: await getServices() };
}

export const headers = () => cacheHeaders;

export const meta: Route.MetaFunction = ({ matches }) => [
  ...buildMeta({ matches, path: '/dich-vu', title: 'Dịch vụ phát triển phần mềm',
    description: 'Phát triển phần mềm theo yêu cầu, website, ứng dụng di động, hệ thống quản trị doanh nghiệp và bảo trì vận hành.' }),
  breadcrumbLd(rootData(matches).settings?.seo.siteUrl ?? '', [{ name: 'Trang chủ', path: '/' }, { name: 'Dịch vụ', path: '/dich-vu' }]),
];

export default function Services({ loaderData }: Route.ComponentProps) {
  const groups = loaderData.groups.filter((g) => g.services.length > 0);
  return (
    <>
      <PageHeader crumbs={[{ name: 'Trang chủ', path: '/' }, { name: 'Dịch vụ', path: '/dich-vu' }]}
        title="Dịch vụ"
        subtitle="Từ phân tích yêu cầu, thiết kế, phát triển đến triển khai và vận hành — mỗi giai đoạn đều có đầu ra rõ ràng." />
      <Container className="space-y-16 py-12 sm:py-16">
        {groups.length === 0 && <p className="text-lg text-fg-muted">Thông tin dịch vụ đang được cập nhật.</p>}
        {groups.map((g) => (
          <section key={g.categorySlug ?? 'khac'} aria-label={g.categoryName ?? 'Dịch vụ'}>
            {groups.length > 1 && <h2 className="mb-6 text-2xl font-semibold tracking-tight">{g.categoryName ?? 'Dịch vụ khác'}</h2>}
            <CardGrid>{g.services.map((s) => <ServiceCardView key={s.id} service={s} />)}</CardGrid>
          </section>
        ))}
      </Container>
    </>
  );
}
