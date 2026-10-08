import { CardGrid, ProductCardView } from '~/components/cards';
import { PageHeader } from '~/components/PageHeader';
import { Container } from '~/components/ui';
import { cacheHeaders, getProducts } from '~/lib/api.server';
import { breadcrumbLd, buildMeta, rootData } from '~/lib/seo';
import type { Route } from './+types/products';

export async function loader() {
  return { products: await getProducts() };
}

export const headers = () => cacheHeaders;

export const meta: Route.MetaFunction = ({ matches }) => [
  ...buildMeta({ matches, path: '/san-pham', title: 'Sản phẩm phần mềm',
    description: 'Các sản phẩm phần mềm do Nguyên Bình sở hữu và phát triển: POS, quản lý khách sạn, nhân sự và hơn thế nữa.' }),
  breadcrumbLd(rootData(matches).settings?.seo.siteUrl ?? '', [{ name: 'Trang chủ', path: '/' }, { name: 'Sản phẩm', path: '/san-pham' }]),
];

export default function Products({ loaderData }: Route.ComponentProps) {
  return (
    <>
      <PageHeader crumbs={[{ name: 'Trang chủ', path: '/' }, { name: 'Sản phẩm', path: '/san-pham' }]}
        title="Sản phẩm của Nguyên Bình"
        subtitle="Phần mềm do Nguyên Bình sở hữu, phát triển và vận hành — triển khai nhanh, tuỳ biến theo quy trình của doanh nghiệp." />
      <Container className="py-12 sm:py-16">
        {loaderData.products.length === 0
          ? <p className="text-lg text-fg-muted">Thông tin sản phẩm đang được cập nhật.</p>
          : <CardGrid>{loaderData.products.map((p) => <ProductCardView key={p.id} product={p} />)}</CardGrid>}
      </Container>
    </>
  );
}
