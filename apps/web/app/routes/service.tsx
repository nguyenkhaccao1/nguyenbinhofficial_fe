import { FaqList, ProcessSteps, TechGroups } from '~/components/blocks';
import { CardGrid, ProjectCardView, ServiceCardView } from '~/components/cards';
import { Icon } from '~/components/Icon';
import { PageHeader } from '~/components/PageHeader';
import { ButtonLink, RichText, Section, SectionHeading } from '~/components/ui';
import { cacheHeaders, getService, orNotFound } from '~/lib/api.server';
import { breadcrumbLd, buildMeta, customSchema, jsonLd, rootData } from '~/lib/seo';
import type { TechnologyGroupDto } from '@nb/shared';
import type { Route } from './+types/service';

export async function loader({ params }: Route.LoaderArgs) {
  return { service: await orNotFound(getService(params.slug)) };
}

export const headers = () => cacheHeaders;

export const meta: Route.MetaFunction = ({ loaderData, matches }) => {
  const s = loaderData?.service;
  if (!s) return [];
  const settings = rootData(matches).settings;
  const path = `/dich-vu/${s.card.slug}`;
  return [
    ...buildMeta({ matches, path, title: s.card.name, description: s.card.shortDescription, image: s.card.cover?.url, seo: s.seo }),
    breadcrumbLd(settings?.seo.siteUrl ?? '', [{ name: 'Trang chủ', path: '/' }, { name: 'Dịch vụ', path: '/dich-vu' }, { name: s.card.name, path }]),
    jsonLd({
      '@context': 'https://schema.org', '@type': 'Service', name: s.card.name, description: s.card.shortDescription ?? undefined,
      url: `${settings?.seo.siteUrl ?? ''}${path}`, provider: { '@type': 'Organization', name: settings?.brand.siteName }, areaServed: 'VN',
    }),
    ...(s.faqs.length > 0 ? [jsonLd({
      '@context': 'https://schema.org', '@type': 'FAQPage',
      mainEntity: s.faqs.map((f) => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })),
    })] : []),
    ...customSchema(s.seo),
  ];
};

export default function Service({ loaderData }: Route.ComponentProps) {
  const s = loaderData.service;
  // Gom cong nghe theo nhom de dung lai TechGroups.
  const techGroups = Object.values(s.technologies.reduce<Record<string, TechnologyGroupDto>>((acc, t) => {
    (acc[t.group] ??= { group: t.group, items: [] }).items.push(t);
    return acc;
  }, {}));

  return (
    <>
      <PageHeader dark crumbs={[{ name: 'Trang chủ', path: '/' }, { name: 'Dịch vụ', path: '/dich-vu' }, { name: s.card.name, path: `/dich-vu/${s.card.slug}` }]}
        eyebrow={s.card.categoryName} title={s.card.name} subtitle={s.card.shortDescription}>
        <div className="mt-9 flex flex-wrap gap-3">
          <ButtonLink to="/lien-he" variant="light" size="lg" arrow>Trao đổi yêu cầu</ButtonLink>
        </div>
      </PageHeader>

      {(s.description || s.deliverables) && (
        <Section>
          <div className="grid gap-12 lg:grid-cols-[7fr_5fr] lg:gap-16">
            <RichText html={s.description} />
            {s.deliverables && (
              <aside className="rounded-xl border border-border bg-bg-subtle p-6 lg:self-start">
                <h2 className="text-lg font-semibold">Bạn nhận được</h2>
                <RichText html={s.deliverables} className="mt-3 text-base" />
              </aside>
            )}
          </div>
        </Section>
      )}

      {s.features.length > 0 && (
        <Section tone="subtle">
          <SectionHeading title="Phạm vi công việc" />
          <CardGrid>
            {s.features.map((f) => (
              <div key={f.title} className="rounded-xl border border-border bg-white p-6">
                <Icon name={f.icon} className="mb-4 size-6 text-primary" />
                <h3 className="text-lg font-semibold tracking-tight">{f.title}</h3>
                {f.description && <p className="mt-2 leading-relaxed text-fg-muted">{f.description}</p>}
              </div>
            ))}
          </CardGrid>
        </Section>
      )}

      {s.process.length > 0 && (
        <Section>
          <SectionHeading eyebrow="Quy trình" title="Cách chúng tôi làm việc" />
          <ProcessSteps steps={s.process} />
        </Section>
      )}

      {techGroups.length > 0 && (
        <Section tone="subtle">
          <SectionHeading title="Công nghệ sử dụng" />
          <TechGroups groups={techGroups} />
        </Section>
      )}

      {s.relatedProjects.length > 0 && (
        <Section>
          <SectionHeading title="Dự án tiêu biểu" action={<ButtonLink to="/du-an" variant="secondary" arrow>Tất cả dự án</ButtonLink>} />
          <CardGrid>{s.relatedProjects.map((p) => <ProjectCardView key={p.id} project={p} />)}</CardGrid>
        </Section>
      )}

      {s.faqs.length > 0 && <Section tone="subtle"><FaqList items={s.faqs} title="Câu hỏi thường gặp" /></Section>}

      {s.otherServices.length > 0 && (
        <Section>
          <SectionHeading title="Dịch vụ khác" />
          <CardGrid>{s.otherServices.map((o) => <ServiceCardView key={o.id} service={o} />)}</CardGrid>
        </Section>
      )}
    </>
  );
}
