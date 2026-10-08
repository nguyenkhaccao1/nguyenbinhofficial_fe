import { PageHeader } from '~/components/PageHeader';
import { PostList } from '~/components/PostList';
import { Container } from '~/components/ui';
import { cacheHeaders, getBlogCategories, getPosts } from '~/lib/api.server';
import { breadcrumbLd, buildMeta, rootData } from '~/lib/seo';
import type { Route } from './+types/blog';

export async function loader({ request }: Route.LoaderArgs) {
  const page = Math.max(1, Number(new URL(request.url).searchParams.get('trang')) || 1);
  const [posts, categories] = await Promise.all([getPosts({ page, pageSize: 9 }), getBlogCategories().catch(() => [])]);
  return { posts, categories };
}

export const headers = () => cacheHeaders;

export const meta: Route.MetaFunction = ({ matches, loaderData }) => [
  ...buildMeta({ matches, path: '/blog', title: 'Blog',
    description: 'Kiến thức phát triển phần mềm, chuyển đổi số và vận hành hệ thống cho doanh nghiệp.',
    noindex: (loaderData?.posts.page ?? 1) > 1 }),
  breadcrumbLd(rootData(matches).settings?.seo.siteUrl ?? '', [{ name: 'Trang chủ', path: '/' }, { name: 'Blog', path: '/blog' }]),
];

export default function Blog({ loaderData }: Route.ComponentProps) {
  return (
    <>
      <PageHeader crumbs={[{ name: 'Trang chủ', path: '/' }, { name: 'Blog', path: '/blog' }]}
        title="Blog" subtitle="Kinh nghiệm thực tế về phát triển phần mềm, kiến trúc hệ thống và chuyển đổi số." />
      <Container className="py-12 sm:py-16">
        <PostList posts={loaderData.posts} categories={loaderData.categories} activeSlug={null} basePath="/blog" />
      </Container>
    </>
  );
}
