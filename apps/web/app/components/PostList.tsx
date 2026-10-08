import { Link } from 'react-router';
import type { BlogCategory, PagedResult, PostCard } from '@nb/shared';
import { CardGrid, PostCardView } from './cards';
import { cx } from './ui';

/** Danh sach bai viet + thanh danh muc + phan trang (dung cho /blog va /blog/{danh-muc}). */
export function PostList({ posts, categories, activeSlug, basePath }: {
  posts: PagedResult<PostCard>; categories: BlogCategory[]; activeSlug: string | null; basePath: string;
}) {
  const visible = categories.filter((c) => c.postCount > 0);
  const chip = (active: boolean) => cx('rounded-full border px-3.5 py-1.5 text-sm font-medium', active ? 'border-dark bg-dark text-white' : 'border-border hover:border-fg/30');
  return (
    <>
      {visible.length > 0 && (
        <nav aria-label="Danh mục" className="flex flex-wrap gap-2">
          <Link to="/blog" className={chip(!activeSlug)}>Tất cả</Link>
          {visible.map((c) => (
            <Link key={c.slug} to={`/blog/${c.slug}`} aria-current={activeSlug === c.slug ? 'page' : undefined} className={chip(activeSlug === c.slug)}>
              {c.name}
            </Link>
          ))}
        </nav>
      )}
      {posts.items.length === 0
        ? <p className="mt-14 text-lg text-fg-muted">Chưa có bài viết.</p>
        : <CardGrid className="mt-10 gap-y-12">{posts.items.map((p) => <PostCardView key={p.id} post={p} />)}</CardGrid>}
      {posts.totalPages > 1 && (
        <nav aria-label="Phân trang" className="mt-14 flex flex-wrap justify-center gap-2">
          {Array.from({ length: posts.totalPages }, (_, i) => i + 1).map((n) => (
            <Link key={n} to={n > 1 ? `${basePath}?trang=${n}` : basePath} aria-current={n === posts.page ? 'page' : undefined}
              className={cx('grid size-10 place-items-center rounded-md border text-sm font-medium', n === posts.page ? 'border-dark bg-dark text-white' : 'border-border hover:border-fg/30')}>
              {n}
            </Link>
          ))}
        </nav>
      )}
    </>
  );
}
