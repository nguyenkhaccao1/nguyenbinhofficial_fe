import { ApiError } from '@nb/shared';
import { ContactPanel, PageRenderer } from '~/components/blocks';
import type { LeadFormType } from '~/components/LeadForm';
import { Breadcrumbs } from '~/components/PageHeader';
import { Container } from '~/components/ui';
import { cacheHeaders, getPage, getProduct } from '~/lib/api.server';
import { buildMeta, customSchema } from '~/lib/seo';
import { useSiteSettings } from '~/root';
import type { Route } from './+types/contact';

const variants: Record<string, { formType: LeadFormType; title: string; heading: string; description: string }> = {
  '/lien-he': {
    formType: 'CONTACT', title: 'Liên hệ', heading: 'Trao đổi về dự án của bạn',
    description: 'Liên hệ Nguyên Bình: tư vấn phần mềm quản lý, POS, quản lý khách sạn, nhân sự, website và mobile app. Gọi 0971 170 103 hoặc gửi yêu cầu.',
  },
  '/yeu-cau-bao-gia': {
    formType: 'QUOTE', title: 'Yêu cầu báo giá', heading: 'Nhận báo giá cho dự án của bạn',
    description: 'Gửi yêu cầu báo giá phần mềm, website, mobile app, POS hoặc dịch vụ kỹ thuật — Nguyên Bình phản hồi với phương án và chi phí rõ ràng.',
  },
  '/yeu-cau-demo': {
    formType: 'DEMO', title: 'Đăng ký demo', heading: 'Đăng ký xem demo sản phẩm',
    description: 'Đăng ký demo phần mềm POS, quản lý khách sạn PerfectKey, quản lý nhân sự — xem hệ thống hoạt động thực tế.',
  },
};

/**
 * /lien-he, /yeu-cau-bao-gia, /yeu-cau-demo. ?san-pham=slug → chon san demo san pham; ?dich-vu=slug → chon san nhu cau.
 * /lien-he co trang Page builder thi dung trang do (tru khi co tham so chon san).
 */
export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const variant = variants[url.pathname] ?? variants['/lien-he']!;
  const productSlug = url.searchParams.get('san-pham');
  const serviceSlug = url.searchParams.get('dich-vu');
  const product = productSlug ? await getProduct(productSlug).then((p) => ({ name: p.card.name, slug: p.card.slug })).catch(() => null) : null;
  const page = url.pathname === '/lien-he' && !productSlug && !serviceSlug
    ? await getPage('/lien-he').catch((error) => {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    })
    : null;
  return { page, variant: { ...variant, path: url.pathname }, product, serviceSlug };
}

export const headers = () => cacheHeaders;

export const meta: Route.MetaFunction = ({ matches, loaderData }) => [
  ...buildMeta({
    matches, path: loaderData?.variant.path ?? '/lien-he', title: loaderData?.page?.title ?? loaderData?.variant.title, seo: loaderData?.page?.seo,
    description: loaderData?.variant.description,
  }),
  ...customSchema(loaderData?.page?.seo),
];

export default function Contact({ loaderData }: Route.ComponentProps) {
  const settings = useSiteSettings();
  const { page, variant, product, serviceSlug } = loaderData;
  if (page) return <PageRenderer page={page} />;
  return (
    <Container className="py-12 sm:py-16 lg:py-20">
      <Breadcrumbs items={[{ name: 'Trang chủ', path: '/' }, { name: variant.title, path: variant.path }]} />
      <div className="mt-10">
        <ContactPanel settings={settings} as="h1" formType={variant.formType} product={product} serviceSlug={serviceSlug}
          title={product ? `Đăng ký demo ${product.name}` : variant.heading} />
      </div>
    </Container>
  );
}
