import { ExternalLink, FileText } from 'lucide-react';
import { Link } from 'react-router';
import {
  ExternalVideoKinds, formatDate, ProjectContentTypeLabels, ProjectLinkKindLabels, ProjectRoleLabels, ProjectStateLabels,
  type ProjectDetail, type PublicProjectMedia,
} from '@nb/shared';
import { LiteVideo } from '~/components/blocks';
import { CardGrid, OwnershipLabel, ProjectCardView } from '~/components/cards';
import { Icon } from '~/components/Icon';
import { Breadcrumbs } from '~/components/PageHeader';
import { BrowserFrame, ButtonLink, Container, Picture, PhoneFrame, RichText, Section, SectionHeading } from '~/components/ui';
import { cacheHeaders, getProject, orNotFound } from '~/lib/api.server';
import { breadcrumbLd, buildMeta, customSchema, jsonLd, rootData } from '~/lib/seo';
import type { Route } from './+types/project';

export async function loader({ params }: Route.LoaderArgs) {
  return { project: await orNotFound(getProject(params.slug)) };
}

export const headers = () => cacheHeaders;

export const meta: Route.MetaFunction = ({ loaderData, matches }) => {
  const p = loaderData?.project;
  if (!p) return [];
  const siteUrl = rootData(matches).settings?.seo.siteUrl ?? '';
  const path = `/du-an/${p.card.slug}`;
  return [
    ...buildMeta({ matches, path, title: p.card.name, description: p.card.shortDescription, image: p.cover?.url ?? p.card.image?.url, seo: p.seo, type: 'article' }),
    breadcrumbLd(siteUrl, [{ name: 'Trang chủ', path: '/' }, { name: 'Dự án', path: '/du-an' }, { name: p.card.name, path }]),
    jsonLd({
      '@context': 'https://schema.org', '@type': 'CreativeWork', name: p.card.name, description: p.card.shortDescription ?? undefined,
      url: `${siteUrl}${path}`, ...(p.cover ? { image: p.cover.url } : {}), ...(p.updatedAt ? { dateModified: p.updatedAt } : {}),
      ...(p.card.isOwnProduct ? { creator: { '@type': 'Organization', name: rootData(matches).settings?.brand.siteName } } : {}),
    }),
    ...customSchema(p.seo),
  ];
};

const caseSections: { key: keyof ProjectDetail; title: string }[] = [
  { key: 'overview', title: 'Tổng quan' },
  { key: 'problem', title: 'Bài toán' },
  { key: 'requirements', title: 'Yêu cầu' },
  { key: 'solution', title: 'Giải pháp' },
  { key: 'architecture', title: 'Kiến trúc' },
  { key: 'challenge', title: 'Thách thức' },
  { key: 'challengeSolution', title: 'Cách xử lý' },
  { key: 'result', title: 'Kết quả' },
];

function MediaGallery({ media, name }: { media: PublicProjectMedia[]; name: string }) {
  const desktop = media.filter((m) => m.image && ['DESKTOP', 'DASHBOARD', 'FEATURE', 'GALLERY', 'BEFORE', 'AFTER'].includes(m.kind));
  const mobile = media.filter((m) => m.image && m.kind === 'MOBILE');
  const videos = media.filter((m) => ExternalVideoKinds.includes(m.kind) || (m.kind === 'VIDEO' && m.fileUrl));
  const docs = media.filter((m) => m.kind === 'PDF' && m.fileUrl);
  if (desktop.length + mobile.length + videos.length + docs.length === 0) return null;
  return (
    <Section tone="subtle">
      <SectionHeading title="Hình ảnh sản phẩm" />
      <div className="space-y-14">
        {videos.map((v, i) => (
          <figure key={`v${i}`} className="mx-auto max-w-5xl">
            <LiteVideo url={(v.externalUrl ?? v.fileUrl)!} poster={v.image} title={v.caption ?? name} />
            {v.caption && <figcaption className="mt-3 text-center text-sm text-fg-muted">{v.caption}</figcaption>}
          </figure>
        ))}
        {desktop.length > 0 && (
          <div className="grid gap-10 lg:grid-cols-2">
            {desktop.map((m, i) => (
              <figure key={`d${i}`} className={desktop.length % 2 === 1 && i === 0 ? 'lg:col-span-2' : undefined}>
                <BrowserFrame>
                  <Picture image={m.image} alt={m.alt ?? m.caption ?? `${name} — màn hình`} sizes="(min-width: 1024px) 50vw, 100vw" imgClassName="w-full" />
                </BrowserFrame>
                {m.caption && <figcaption className="mt-3 text-sm text-fg-muted">{m.caption}</figcaption>}
              </figure>
            ))}
          </div>
        )}
        {mobile.length > 0 && (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
            {mobile.map((m, i) => (
              <figure key={`m${i}`}>
                <PhoneFrame><Picture image={m.image} alt={m.alt ?? m.caption ?? `${name} — mobile`} sizes="(min-width: 1024px) 25vw, 50vw" imgClassName="w-full" /></PhoneFrame>
                {m.caption && <figcaption className="mt-3 text-center text-sm text-fg-muted">{m.caption}</figcaption>}
              </figure>
            ))}
          </div>
        )}
        {docs.length > 0 && (
          <ul className="flex flex-wrap gap-3">
            {docs.map((d, i) => (
              <li key={`p${i}`}>
                <a href={d.fileUrl!} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-md border border-border bg-white px-4 py-2.5 font-medium hover:border-fg/30">
                  <FileText className="size-4" aria-hidden />{d.caption ?? 'Tài liệu PDF'}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Section>
  );
}

export default function Project({ loaderData }: Route.ComponentProps) {
  const p = loaderData.project;
  const card = p.card;
  const year = card.year ?? (p.launchDate ? new Date(p.launchDate).getFullYear() : null);
  const facts = [
    p.client && ['Khách hàng', p.client.websiteUrl ? <a href={p.client.websiteUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">{p.client.name}</a> : p.client.name],
    p.industry && ['Ngành', <Link to={`/du-an?nganh=${p.industry.slug}`} className="hover:underline">{p.industry.name}</Link>],
    ['Loại', ProjectContentTypeLabels[card.primaryContentType]],
    card.projectRoles.length > 0 && ['Vai trò của Nguyên Bình', card.projectRoles.map((r) => ProjectRoleLabels[r]).join(', ')],
    year && ['Năm', String(year)],
    ['Trạng thái', ProjectStateLabels[p.projectState]],
    p.product && ['Sản phẩm', <Link to={`/san-pham/${p.product.slug}`} className="hover:underline">{p.product.name}</Link>],
  ].filter(Boolean) as [string, React.ReactNode][];
  const sections = caseSections.filter((s) => typeof p[s.key] === 'string' && (p[s.key] as string).trim());

  return (
    <>
      <div className="bg-dark text-white tone-dark">
        <Container className="pt-10 pb-16 sm:pt-12 lg:pb-24">
          <Breadcrumbs items={[{ name: 'Trang chủ', path: '/' }, { name: 'Dự án', path: '/du-an' }, { name: card.name, path: `/du-an/${card.slug}` }]} />
          <div className="mt-10 grid items-end gap-12 lg:grid-cols-[6fr_6fr]">
            <div>
              <OwnershipLabel project={card} className="text-sm" />
              <h1 className="mt-3 text-4xl leading-[1.08] font-semibold tracking-tight text-balance sm:text-5xl lg:text-[3.5rem]">{card.name}</h1>
              {card.shortDescription && <p className="mt-6 text-lg leading-8 text-white/70 sm:text-xl">{card.shortDescription}</p>}
              {p.client?.logo && <Picture image={p.client.logo} alt={p.client.name} sizes="160px" imgClassName="mt-8 h-10 w-auto brightness-0 invert" />}
              {p.links.length > 0 && (
                <div className="mt-8 flex flex-wrap gap-3">
                  {p.links.map((l, i) => (
                    <ButtonLink key={l.url} to={l.url} variant={i === 0 ? 'light' : 'secondary'}>
                      {l.label ?? ProjectLinkKindLabels[l.kind]}<ExternalLink className="size-4" aria-hidden />
                    </ButtonLink>
                  ))}
                </div>
              )}
            </div>
            {p.cover && (
              <BrowserFrame>
                <Picture image={p.cover} alt={card.name} sizes="(min-width: 1024px) 50vw, 100vw" priority imgClassName="w-full" />
              </BrowserFrame>
            )}
          </div>
        </Container>
      </div>

      <Container className="py-16 sm:py-20">
        <div className="grid gap-14 lg:grid-cols-[280px_1fr] lg:gap-20">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <dl className="divide-y divide-border border-y border-border">
              {facts.map(([k, v]) => (
                <div key={k} className="py-4">
                  <dt className="text-xs font-semibold tracking-wider text-fg-muted uppercase">{k}</dt>
                  <dd className="mt-1 font-medium">{v}</dd>
                </div>
              ))}
            </dl>
            {p.technologies.length > 0 && (
              <div className="mt-8">
                <p className="text-xs font-semibold tracking-wider text-fg-muted uppercase">Công nghệ</p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {p.technologies.map((t) => (
                    <li key={t.slug}>
                      <Link to={`/du-an?cong-nghe=${t.slug}`} className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-sm font-medium hover:border-fg/30">
                        {t.logo && <Picture image={t.logo} alt="" sizes="16px" imgClassName="size-4 object-contain" />}{t.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {p.qr && (
              <div className="mt-8">
                <p className="text-xs font-semibold tracking-wider text-fg-muted uppercase">Quét để tải ứng dụng</p>
                <Picture image={p.qr} alt={`Mã QR ${card.name}`} sizes="160px" imgClassName="mt-3 size-36 rounded-md border border-border" />
              </div>
            )}
          </aside>

          <div className="min-w-0 space-y-14">
            {p.nguyenBinhContribution && (
              <div className="rounded-xl border border-primary/25 bg-primary/5 p-6">
                <p className="text-sm font-semibold text-primary">Phần việc của Nguyên Bình</p>
                <p className="mt-2 leading-relaxed whitespace-pre-line">{p.nguyenBinhContribution}</p>
              </div>
            )}
            {p.metrics.length > 0 && (
              <dl className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
                {p.metrics.map((m) => (
                  <div key={m.label} className="bg-bg p-6">
                    <dd className="text-3xl font-semibold tracking-tight">{m.value}{m.unit && <span className="ml-1 text-xl text-fg-muted">{m.unit}</span>}</dd>
                    <dt className="mt-1 font-medium">{m.label}</dt>
                    {m.description && <p className="mt-1 text-sm text-fg-muted">{m.description}</p>}
                  </div>
                ))}
              </dl>
            )}
            {sections.map((s) => (
              <section key={s.key} aria-labelledby={`cs-${s.key}`}>
                <h2 id={`cs-${s.key}`} className="text-2xl font-semibold tracking-tight sm:text-3xl">{s.title}</h2>
                <RichText html={p[s.key] as string} className="mt-5 max-w-3xl" />
                {s.key === 'architecture' && p.architectureImage && (
                  <Picture image={p.architectureImage} alt={`Sơ đồ kiến trúc ${card.name}`} sizes="(min-width: 1024px) 800px, 100vw" imgClassName="mt-8 w-full rounded-xl border border-border" />
                )}
              </section>
            ))}
            {p.features.length > 0 && (
              <section aria-labelledby="cs-features">
                <h2 id="cs-features" className="text-2xl font-semibold tracking-tight sm:text-3xl">Tính năng chính</h2>
                <ul className="mt-6 grid gap-4 sm:grid-cols-2">
                  {p.features.map((f) => (
                    <li key={f.title} className="rounded-xl border border-border p-5">
                      <div className="flex items-center gap-3">
                        <Icon name={f.icon} className="size-5 text-primary" fallback={null} />
                        <h3 className="font-semibold">{f.title}</h3>
                      </div>
                      {f.description && <p className="mt-2 leading-relaxed text-fg-muted">{f.description}</p>}
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {p.updatedAt && <p className="text-sm text-fg-muted">Cập nhật {formatDate(p.updatedAt)}</p>}
          </div>
        </div>
      </Container>

      <MediaGallery media={p.media} name={card.name} />

      {p.related.length > 0 && (
        <Section>
          <SectionHeading title="Dự án liên quan" action={<ButtonLink to="/du-an" variant="secondary" arrow>Tất cả dự án</ButtonLink>} />
          <CardGrid>{p.related.map((r) => <ProjectCardView key={r.id} project={r} />)}</CardGrid>
        </Section>
      )}

      <Section tone="dark" padding="md">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Bạn có bài toán tương tự?</h2>
            <p className="mt-2 text-white/65">Trao đổi với đội ngũ kỹ thuật để làm rõ yêu cầu và phạm vi.</p>
          </div>
          <div className="flex gap-3">
            <ButtonLink to="/lien-he" variant="light" arrow>Trao đổi dự án</ButtonLink>
          </div>
        </div>
      </Section>
    </>
  );
}
