import { Search as SearchIcon } from 'lucide-react';
import { Form, Link } from 'react-router';
import { PageHeader } from '~/components/PageHeader';
import { Container, Picture } from '~/components/ui';
import { search } from '~/lib/api.server';
import { buildMeta } from '~/lib/seo';
import type { Route } from './+types/search';

const kindLabels = { product: 'Sản phẩm', project: 'Dự án', service: 'Dịch vụ', post: 'Bài viết' } as const;

export async function loader({ request }: Route.LoaderArgs) {
  const q = new URL(request.url).searchParams.get('q')?.trim() ?? '';
  return { q, result: q.length >= 2 ? await search(q) : null };
}

// Trang tim kiem luon noindex (tranh trang mong/trung lap).
export const meta: Route.MetaFunction = ({ matches, loaderData }) =>
  buildMeta({ matches, path: '/search', title: loaderData?.q ? `Tìm kiếm: ${loaderData.q}` : 'Tìm kiếm', noindex: true });

export default function Search({ loaderData }: Route.ComponentProps) {
  const { q, result } = loaderData;
  return (
    <>
      <PageHeader crumbs={[{ name: 'Trang chủ', path: '/' }, { name: 'Tìm kiếm', path: '/search' }]} title="Tìm kiếm">
        <Form action="/search" className="mt-8 flex max-w-2xl gap-2" role="search">
          <input type="search" name="q" defaultValue={q} placeholder="Sản phẩm, dự án, dịch vụ, bài viết…" aria-label="Từ khoá" minLength={2}
            className="h-12 flex-1 rounded-md border border-border bg-white px-4 text-base outline-none focus:border-primary" />
          <button type="submit" className="inline-flex h-12 items-center gap-2 rounded-md bg-primary px-5 font-medium text-white hover:bg-primary/90">
            <SearchIcon className="size-4" aria-hidden />Tìm
          </button>
        </Form>
      </PageHeader>
      <Container className="max-w-[900px] py-12">
        {result && (result.hits.length === 0 ? (
          <p className="text-lg text-fg-muted">Không tìm thấy kết quả cho “{q}”.</p>
        ) : (
          <>
            <p className="text-sm text-fg-muted">{result.hits.length} kết quả cho “{q}”</p>
            <ul className="mt-6 divide-y divide-border border-y border-border">
              {result.hits.map((h) => (
                <li key={h.url}>
                  <Link to={h.url} className="group flex gap-5 py-6">
                    {h.image && <Picture image={h.image} alt="" sizes="120px" imgClassName="hidden aspect-[4/3] w-28 shrink-0 rounded-md border border-border object-cover sm:block" />}
                    <span>
                      <span className="text-xs font-semibold tracking-wider text-primary uppercase">{kindLabels[h.kind]}</span>
                      <span className="mt-1 block text-lg font-semibold group-hover:text-primary">{h.title}</span>
                      {h.excerpt && <span className="mt-1 line-clamp-2 block text-fg-muted">{h.excerpt}</span>}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        ))}
      </Container>
    </>
  );
}
