import { Check } from 'lucide-react';
import { CommercialTypeLabels, ProductTypeLabels } from '@nb/shared';
import { ContactPanel, FaqList, LiteVideo, PricingTable, TestimonialList } from '~/components/blocks';
import { CardGrid, ProjectCardView } from '~/components/cards';
import { Icon } from '~/components/Icon';
import { Breadcrumbs } from '~/components/PageHeader';
import { Badge, BrowserFrame, ButtonLink, Container, Picture, PhoneFrame, RichText, Section, SectionHeading } from '~/components/ui';
import { cacheHeaders, getProduct, orNotFound } from '~/lib/api.server';
import { breadcrumbLd, buildMeta, customSchema, jsonLd, rootData } from '~/lib/seo';
import { useSiteSettings } from '~/root';
import type { Route } from './+types/product';

export async function loader({ params }: Route.LoaderArgs) {
  return { product: await orNotFound(getProduct(params.slug)) };
}

export const headers = () => cacheHeaders;

export const meta: Route.MetaFunction = ({ loaderData, matches }) => {
  const p = loaderData?.product;
  if (!p) return [];
  const siteUrl = rootData(matches).settings?.seo.siteUrl ?? '';
  const path = `/san-pham/${p.card.slug}`;
  const priced = p.plans.filter((x) => x.priceAmount != null);
  return [
    ...buildMeta({ matches, path, title: p.card.name, description: p.card.shortDescription ?? p.card.tagline, image: p.card.hero?.url, seo: p.seo, type: 'product' }),
    breadcrumbLd(siteUrl, [{ name: 'Trang chủ', path: '/' }, { name: 'Sản phẩm', path: '/san-pham' }, { name: p.card.name, path }]),
    jsonLd({
      '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: p.card.name, applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web', description: p.card.shortDescription ?? undefined, url: `${siteUrl}${path}`,
      ...(p.card.hero ? { image: p.card.hero.url } : {}),
      ...(priced.length > 0 ? { offers: priced.map((x) => ({ '@type': 'Offer', name: x.name, price: x.priceAmount, priceCurrency: x.currency })) } : {}),
    }),
    ...(p.faqs.length > 0 ? [jsonLd({
      '@context': 'https://schema.org', '@type': 'FAQPage',
      mainEntity: p.faqs.map((f) => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })),
    })] : []),
    ...customSchema(p.seo),
  ];
};

const textSections = [
  ['problem', 'Bài toán'],
  ['solution', 'Giải pháp'],
  ['targetUsers', 'Phù hợp với'],
  ['integration', 'Tích hợp'],
  ['deployment', 'Triển khai'],
  ['security', 'Bảo mật'],
] as const;

export default function Product({ loaderData }: Route.ComponentProps) {
  const p = loaderData.product;
  const settings = useSiteSettings();
  const card = p.card;
  const demoUrl = `/lien-he?san-pham=${card.slug}`;
  const screens = p.media.filter((m) => m.image && m.kind !== 'MOBILE');
  const mobile = p.media.filter((m) => m.image && m.kind === 'MOBILE');
  const texts = textSections.filter(([k]) => p[k]?.trim());

  return (
    <>
      <div className="bg-dark text-white tone-dark">
        <Container className="pt-10 pb-16 sm:pt-12 lg:pb-24">
          <Breadcrumbs items={[{ name: 'Trang chủ', path: '/' }, { name: 'Sản phẩm', path: '/san-pham' }, { name: card.name, path: `/san-pham/${card.slug}` }]} />
          <div className="mt-10 grid items-center gap-12 lg:grid-cols-[5fr_7fr]">
            <div>
              <div className="flex items-center gap-3">
                {card.logo && <Picture image={card.logo} alt="" sizes="48px" imgClassName="size-12 rounded-lg bg-white object-contain p-1" />}
                <Badge>{ProductTypeLabels[card.productType]}</Badge>
              </div>
              <h1 className="mt-6 text-4xl leading-[1.08] font-semibold tracking-tight text-balance sm:text-5xl lg:text-[3.5rem]">{card.name}</h1>
              {card.tagline && <p className="mt-4 text-xl font-medium text-white/90">{card.tagline}</p>}
              {card.shortDescription && <p className="mt-4 text-lg leading-8 text-white/70">{card.shortDescription}</p>}
              <div className="mt-9 flex flex-wrap gap-3">
                <ButtonLink to={demoUrl} variant="light" size="lg" arrow>Yêu cầu demo</ButtonLink>
                {p.demoUrl && <ButtonLink to={p.demoUrl} variant="secondary" size="lg">Dùng thử</ButtonLink>}
              </div>
              <p className="mt-6 text-sm text-white/50">{CommercialTypeLabels[p.commercialType]}{p.pricingNote && ` · ${p.pricingNote}`}</p>
            </div>
            {card.hero && (
              <BrowserFrame>
                <Picture image={card.hero} alt={card.name} sizes="(min-width: 1024px) 58vw, 100vw" priority imgClassName="w-full" />
              </BrowserFrame>
            )}
          </div>
        </Container>
      </div>

      {p.description && (
        <Section padding="md">
          <RichText html={p.description} className="mx-auto max-w-3xl" />
        </Section>
      )}

      {p.features.length > 0 && (
        <Section tone="subtle">
          <SectionHeading eyebrow="Tính năng" title={`${card.name} làm được gì`} />
          <CardGrid>
            {p.features.map((f) => (
              <div key={f.title} className="rounded-xl border border-border bg-white p-6">
                {f.image ? <Picture image={f.image} alt={f.title} sizes="(min-width: 1024px) 33vw, 100vw" imgClassName="mb-5 aspect-[16/10] w-full rounded-lg border border-border object-cover object-top" />
                  : <Icon name={f.icon} className="mb-4 size-6 text-primary" />}
                <h3 className="text-lg font-semibold tracking-tight">{f.title}</h3>
                {f.description && <p className="mt-2 leading-relaxed text-fg-muted">{f.description}</p>}
              </div>
            ))}
          </CardGrid>
        </Section>
      )}

      {p.modules.length > 0 && (
        <Section>
          <SectionHeading eyebrow="Module" title="Các phân hệ" />
          <div className="divide-y divide-border border-y border-border">
            {p.modules.map((m) => (
              <div key={m.name} className="grid gap-6 py-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
                <div>
                  <div className="flex items-center gap-3"><Icon name={m.icon} className="size-6 text-primary" fallback={null} /><h3 className="text-2xl font-semibold tracking-tight">{m.name}</h3></div>
                  {m.description && <p className="mt-3 leading-relaxed text-fg-muted">{m.description}</p>}
                  {m.items.length > 0 && (
                    <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                      {m.items.map((i) => <li key={i} className="flex gap-2"><Check className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />{i}</li>)}
                    </ul>
                  )}
                </div>
                {m.image && <BrowserFrame><Picture image={m.image} alt={m.name} sizes="(min-width: 1024px) 50vw, 100vw" imgClassName="w-full" /></BrowserFrame>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {(screens.length > 0 || mobile.length > 0 || p.demoVideoUrl) && (
        <Section tone="subtle">
          <SectionHeading title="Giao diện thực tế" />
          <div className="space-y-12">
            {p.demoVideoUrl && <div className="mx-auto max-w-5xl"><LiteVideo url={p.demoVideoUrl} title={`Demo ${card.name}`} /></div>}
            {screens.length > 0 && (
              <div className="grid gap-10 lg:grid-cols-2">
                {screens.map((m, i) => (
                  <figure key={i}>
                    <BrowserFrame><Picture image={m.image} alt={m.alt ?? m.caption ?? card.name} sizes="(min-width: 1024px) 50vw, 100vw" imgClassName="w-full" /></BrowserFrame>
                    {m.caption && <figcaption className="mt-3 text-sm text-fg-muted">{m.caption}</figcaption>}
                  </figure>
                ))}
              </div>
            )}
            {mobile.length > 0 && (
              <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
                {mobile.map((m, i) => <PhoneFrame key={i}><Picture image={m.image} alt={m.alt ?? card.name} sizes="25vw" imgClassName="w-full" /></PhoneFrame>)}
              </div>
            )}
          </div>
        </Section>
      )}

      {texts.length > 0 && (
        <Section>
          <div className="grid gap-x-16 gap-y-12 lg:grid-cols-2">
            {texts.map(([k, title]) => (
              <section key={k}>
                <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
                <RichText html={p[k]} className="mt-4" />
              </section>
            ))}
          </div>
        </Section>
      )}

      {p.plans.length > 0 && (
        <Section tone="subtle" id="bang-gia">
          <SectionHeading title="Bảng giá" subtitle={p.pricingNote ?? undefined} align="center" />
          <PricingTable plans={p.plans} />
        </Section>
      )}

      {p.testimonials.length > 0 && (
        <Section>
          <SectionHeading title="Khách hàng nói gì" />
          <TestimonialList items={p.testimonials} />
        </Section>
      )}

      {p.caseStudies.length > 0 && (
        <Section tone="subtle">
          <SectionHeading title={`Dự án sử dụng ${card.name}`} />
          <CardGrid>{p.caseStudies.map((c) => <ProjectCardView key={c.id} project={c} />)}</CardGrid>
        </Section>
      )}

      {p.faqs.length > 0 && (
        <Section>
          <FaqList items={p.faqs} title="Câu hỏi thường gặp" />
        </Section>
      )}

      <Section tone="dark" padding="md">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Xem {card.name} hoạt động thực tế</h2>
            <p className="mt-2 text-white/65">Đặt lịch demo theo đúng quy trình của doanh nghiệp bạn.</p>
          </div>
          <ButtonLink to={demoUrl} variant="light" arrow>Yêu cầu demo</ButtonLink>
        </div>
      </Section>

      <Section tone="subtle" id="dang-ky-demo">
        <ContactPanel settings={settings} product={{ name: card.name, slug: card.slug }} title={`Đăng ký demo ${card.name}`}
          subtitle="Chúng tôi sẽ liên hệ để sắp xếp buổi demo theo đúng quy trình của doanh nghiệp bạn." />
      </Section>
    </>
  );
}
