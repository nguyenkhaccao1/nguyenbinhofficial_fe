import { TechnologyGroupLabels } from '@nb/shared';
import { Link } from 'react-router';
import { PageHeader } from '~/components/PageHeader';
import { Container, Picture } from '~/components/ui';
import { cacheHeaders, getTechnologies } from '~/lib/api.server';
import { breadcrumbLd, buildMeta, rootData } from '~/lib/seo';
import type { Route } from './+types/technologies';

export async function loader() {
  return { groups: await getTechnologies() };
}

export const headers = () => cacheHeaders;

export const meta: Route.MetaFunction = ({ matches }) => [
  ...buildMeta({ matches, path: '/cong-nghe', title: 'Công nghệ',
    description: 'Công nghệ Nguyên Bình sử dụng trong dự án thực tế: .NET, React, React Native, SQL Server, Docker và hơn thế nữa.' }),
  breadcrumbLd(rootData(matches).settings?.seo.siteUrl ?? '', [{ name: 'Trang chủ', path: '/' }, { name: 'Công nghệ', path: '/cong-nghe' }]),
];

export default function Technologies({ loaderData }: Route.ComponentProps) {
  return (
    <>
      <PageHeader crumbs={[{ name: 'Trang chủ', path: '/' }, { name: 'Công nghệ', path: '/cong-nghe' }]}
        title="Công nghệ" subtitle="Những công nghệ đội ngũ đã dùng trong dự án thực tế. Bấm vào từng công nghệ để xem dự án liên quan." />
      <Container className="space-y-14 py-12 sm:py-16">
        {loaderData.groups.map((g) => (
          <section key={g.group}>
            <h2 className="font-mono text-sm tracking-wider text-fg-muted uppercase">{TechnologyGroupLabels[g.group]}</h2>
            <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {g.items.map((t) => (
                <li key={t.slug}>
                  <Link to={`/du-an?cong-nghe=${t.slug}`} className="flex h-full items-start gap-4 rounded-xl border border-border p-5 transition-colors hover:border-primary/40">
                    {t.logo ? <Picture image={t.logo} alt="" sizes="40px" imgClassName="size-10 object-contain" />
                      : <span className="grid size-10 place-items-center rounded-md bg-bg-subtle font-mono text-sm font-semibold">{t.name.slice(0, 2)}</span>}
                    <span>
                      <span className="block font-semibold">{t.name}</span>
                      {t.description && <span className="mt-1 block text-sm leading-relaxed text-fg-muted">{t.description}</span>}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </Container>
    </>
  );
}
