import { formatDate } from '@nb/shared';
import { Link } from 'react-router';
import { CardGrid, PostCardView } from '~/components/cards';
import { Breadcrumbs, PageHeader } from '~/components/PageHeader';
import { PostList } from '~/components/PostList';
import { Container, Picture, RichText, Section, SectionHeading } from '~/components/ui';
import { cacheHeaders, getBlogCategories, getPosts, orNotFound, resolveBlog } from '~/lib/api.server';
import { breadcrumbLd, buildMeta, customSchema, jsonLd, rootData } from '~/lib/seo';
import type { Route } from './+types/blog-slug';

/** /blog/{slug}: bai viet hoac danh muc (chung khong gian slug — API /blog/resolve). */
export async function loader({ params, request }: Route.LoaderArgs) {
  const resolved = await orNotFound(resolveBlog(params.slug));
  if (resolved.kind === 'category') {
    const page = Math.max(1, Number(new URL(request.url).searchParams.get('trang')) || 1);
    const [posts, categories] = await Promise.all([
      getPosts({ category: params.slug, page, pageSize: 9 }), getBlogCategories().catch(() => []),
    ]);
    return { kind: 'category' as const, category: resolved.category!, posts, categories };
  }
  return { kind: 'post' as const, post: resolved.post! };
}

export const headers = () => cacheHeaders;

export const meta: Route.MetaFunction = ({ loaderData, matches }) => {
  if (!loaderData) return [];
  const settings = rootData(matches).settings;
  const siteUrl = settings?.seo.siteUrl ?? '';
  if (loaderData.kind === 'category') {
    const c = loaderData.category;
    const path = `/blog/${c.slug}`;
    return [
      ...buildMeta({ matches, path, title: c.name, description: c.description, seo: c.seo, noindex: loaderData.posts.page > 1 }),
      breadcrumbLd(siteUrl, [{ name: 'Trang chủ', path: '/' }, { name: 'Blog', path: '/blog' }, { name: c.name, path }]),
    ];
  }
  const p = loaderData.post;
  const path = `/blog/${p.card.slug}`;
  return [
    ...buildMeta({ matches, path, title: p.card.title, description: p.card.excerpt, image: p.card.cover?.url, seo: p.seo, type: 'article' }),
    ...(p.card.publishedAt ? [{ property: 'article:published_time', content: p.card.publishedAt }] : []),
    breadcrumbLd(siteUrl, [
      { name: 'Trang chủ', path: '/' }, { name: 'Blog', path: '/blog' },
      ...(p.card.category ? [{ name: p.card.category.name, path: `/blog/${p.card.category.slug}` }] : []),
      { name: p.card.title, path },
    ]),
    jsonLd({
      '@context': 'https://schema.org', '@type': 'BlogPosting', headline: p.card.title, description: p.card.excerpt ?? undefined,
      url: `${siteUrl}${path}`, mainEntityOfPage: `${siteUrl}${path}`, ...(p.card.cover ? { image: p.card.cover.url } : {}),
      ...(p.card.publishedAt ? { datePublished: p.card.publishedAt } : {}), ...(p.updatedAt ? { dateModified: p.updatedAt } : {}),
      ...(p.author ? { author: { '@type': 'Person', name: p.author.name } } : {}),
      publisher: {
        '@type': 'Organization', name: settings?.brand.siteName,
        ...(settings?.brand.logo?.url ? { logo: { '@type': 'ImageObject', url: settings.brand.logo.url } } : {}),
      },
    }),
    ...customSchema(p.seo),
  ];
};

export default function BlogSlug({ loaderData }: Route.ComponentProps) {
  if (loaderData.kind === 'category') {
    const c = loaderData.category;
    return (
      <>
        <PageHeader crumbs={[{ name: 'Trang chủ', path: '/' }, { name: 'Blog', path: '/blog' }, { name: c.name, path: `/blog/${c.slug}` }]}
          eyebrow="Danh mục" title={c.name} subtitle={c.description} />
        <Container className="py-12 sm:py-16">
          <PostList posts={loaderData.posts} categories={loaderData.categories} activeSlug={c.slug} basePath={`/blog/${c.slug}`} />
        </Container>
      </>
    );
  }

  const p = loaderData.post;
  return (
    <article>
      <Container className="max-w-[820px] pt-10 pb-10 sm:pt-12">
        <Breadcrumbs items={[
          { name: 'Trang chủ', path: '/' }, { name: 'Blog', path: '/blog' },
          ...(p.card.category ? [{ name: p.card.category.name, path: `/blog/${p.card.category.slug}` }] : []),
        ]} />
        <h1 className="mt-8 text-4xl leading-[1.12] font-semibold tracking-tight text-balance sm:text-5xl">{p.card.title}</h1>
        {p.card.excerpt && <p className="mt-5 text-xl leading-relaxed text-fg-muted">{p.card.excerpt}</p>}
        <p className="mt-6 text-sm text-fg-muted">
          {p.author && <span className="font-medium text-fg">{p.author.name} · </span>}
          {p.card.publishedAt && <time dateTime={p.card.publishedAt}>{formatDate(p.card.publishedAt)}</time>} · {p.card.readingMinutes} phút đọc
        </p>
      </Container>
      {p.card.cover && (
        <Container className="max-w-[1100px]">
          <Picture image={p.card.cover} alt={p.card.title} sizes="(min-width: 1100px) 1100px, 100vw" priority imgClassName="w-full rounded-xl border border-border" />
        </Container>
      )}
      <Container className="max-w-[720px] py-12 sm:py-16">
        <RichText html={p.contentHtml} />
        {p.tags.length > 0 && (
          <ul className="mt-12 flex flex-wrap gap-2">
            {p.tags.map((t) => <li key={t.slug} className="rounded-full bg-bg-subtle px-3 py-1 text-sm text-fg-muted">#{t.name}</li>)}
          </ul>
        )}
        {p.author && (
          <aside className="mt-12 flex gap-4 border-t border-border pt-8">
            {p.author.avatar && <Picture image={p.author.avatar} alt="" sizes="56px" imgClassName="size-14 rounded-full object-cover" />}
            <div>
              <p className="font-semibold">{p.author.name}</p>
              {p.author.title && <p className="text-sm text-fg-muted">{p.author.title}</p>}
              {p.author.bio && <p className="mt-2 leading-relaxed text-fg-muted">{p.author.bio}</p>}
            </div>
          </aside>
        )}
        {p.categories.length > 0 && (
          <p className="mt-8 text-sm text-fg-muted">
            Danh mục: {p.categories.map((c, i) => <span key={c.slug}>{i > 0 && ', '}<Link to={`/blog/${c.slug}`} className="text-primary hover:underline">{c.name}</Link></span>)}
          </p>
        )}
      </Container>
      {p.related.length > 0 && (
        <Section tone="subtle">
          <SectionHeading title="Bài viết liên quan" />
          <CardGrid>{p.related.map((r) => <PostCardView key={r.id} post={r} />)}</CardGrid>
        </Section>
      )}
    </article>
  );
}
