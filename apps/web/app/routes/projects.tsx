import { Link } from 'react-router';
import { ProjectContentTypeLabels, type ProjectContentType } from '@nb/shared';
import { CardGrid, ProjectCardView } from '~/components/cards';
import { PageHeader } from '~/components/PageHeader';
import { Container, cx } from '~/components/ui';
import { cacheHeaders, getIndustries, getProjects } from '~/lib/api.server';
import { breadcrumbLd, buildMeta, rootData } from '~/lib/seo';
import type { Route } from './+types/projects';

/** Loai du an hien thanh bo loc (cac loai con lai van loc duoc qua URL ?loai=). */
const filterTypes: ProjectContentType[] = ['OWN_PRODUCT', 'CUSTOM_PROJECT', 'WEBSITE', 'MOBILE_APP', 'SAAS', 'ENTERPRISE_SOFTWARE', 'ECOMMERCE'];

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const type = url.searchParams.get('loai');
  const industry = url.searchParams.get('nganh');
  const technology = url.searchParams.get('cong-nghe');
  const page = Math.max(1, Number(url.searchParams.get('trang')) || 1);
  const [projects, industries] = await Promise.all([
    getProjects({ contentType: type, industry, technology, page, pageSize: 12 }),
    getIndustries().catch(() => []),
  ]);
  return { projects, industries: industries.filter((i) => i.projectCount > 0), filters: { type, industry, technology, page } };
}

export const headers = () => cacheHeaders;

export const meta: Route.MetaFunction = ({ matches, loaderData }) => {
  const f = loaderData?.filters;
  const filtered = !!(f?.type || f?.industry || f?.technology || (f?.page ?? 1) > 1);
  return [
    ...buildMeta({
      matches, path: '/du-an', title: 'Dự án đã triển khai',
      description: 'Các dự án phần mềm, website và ứng dụng do Nguyên Bình phát triển hoặc tham gia triển khai — nêu rõ vai trò của Nguyên Bình trong từng dự án.',
      noindex: filtered,
    }),
    breadcrumbLd(rootData(matches).settings?.seo.siteUrl ?? '', [{ name: 'Trang chủ', path: '/' }, { name: 'Dự án', path: '/du-an' }]),
  ];
};

function filterHref(current: Record<string, string | number | null>, change: Record<string, string | null>) {
  const params = new URLSearchParams();
  const next = { loai: current.type, nganh: current.industry, 'cong-nghe': current.technology, ...change } as Record<string, string | number | null>;
  for (const [k, v] of Object.entries(next)) if (v) params.set(k, String(v));
  const qs = params.toString();
  return qs ? `/du-an?${qs}` : '/du-an';
}

function Chip({ to, active, children }: { to: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link to={to} preventScrollReset aria-current={active ? 'true' : undefined}
      className={cx('rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
        active ? 'border-dark bg-dark text-white' : 'border-border bg-white hover:border-fg/30')}>
      {children}
    </Link>
  );
}

export default function Projects({ loaderData }: Route.ComponentProps) {
  const { projects, industries, filters } = loaderData;
  const base = { type: filters.type, industry: filters.industry, technology: filters.technology };
  return (
    <>
      <PageHeader crumbs={[{ name: 'Trang chủ', path: '/' }, { name: 'Dự án', path: '/du-an' }]}
        title="Dự án đã triển khai"
        subtitle="Sản phẩm do Nguyên Bình sở hữu và các dự án phát triển theo yêu cầu cho khách hàng. Mỗi dự án ghi rõ vai trò của Nguyên Bình." />
      <Container className="py-12 sm:py-16">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Lọc theo loại">
            <Chip to={filterHref(base, { loai: null, trang: null })} active={!filters.type}>Tất cả</Chip>
            {filterTypes.map((t) => (
              <Chip key={t} to={filterHref(base, { loai: t, trang: null })} active={filters.type === t}>{ProjectContentTypeLabels[t]}</Chip>
            ))}
          </div>
          {industries.length > 0 && (
            <div className="flex flex-wrap gap-2" role="group" aria-label="Lọc theo ngành">
              {industries.map((i) => (
                <Chip key={i.slug} to={filterHref(base, { nganh: filters.industry === i.slug ? null : i.slug, trang: null })} active={filters.industry === i.slug}>
                  {i.name}
                </Chip>
              ))}
            </div>
          )}
          {filters.technology && (
            <p className="text-sm text-fg-muted">
              Công nghệ: <strong className="text-fg">{filters.technology}</strong> · <Link to={filterHref(base, { 'cong-nghe': null })} className="text-primary hover:underline">Bỏ lọc</Link>
            </p>
          )}
        </div>

        {projects.items.length === 0 ? (
          <p className="mt-16 text-lg text-fg-muted">Chưa có dự án phù hợp bộ lọc.</p>
        ) : (
          <CardGrid className="mt-10">{projects.items.map((p, i) => <ProjectCardView key={p.id} project={p} priority={i < 3} />)}</CardGrid>
        )}

        {projects.totalPages > 1 && (
          <nav aria-label="Phân trang" className="mt-14 flex flex-wrap justify-center gap-2">
            {Array.from({ length: projects.totalPages }, (_, i) => i + 1).map((n) => (
              <Link key={n} to={filterHref(base, { trang: n > 1 ? String(n) : null })} aria-current={n === projects.page ? 'page' : undefined}
                className={cx('grid size-10 place-items-center rounded-md border text-sm font-medium',
                  n === projects.page ? 'border-dark bg-dark text-white' : 'border-border hover:border-fg/30')}>
                {n}
              </Link>
            ))}
          </nav>
        )}
      </Container>
    </>
  );
}
