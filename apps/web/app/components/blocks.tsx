import { Check, Mail, MessageCircle, Phone, Play, Plus, Quote } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import {
  BillingPeriodLabels, TechnologyGroupLabels, type IndustryCard, type NamedLink, type PostCard, type ProductCard, type ProjectCard,
  type PublicBlock, type PublicFaq, type PublicImage, type PublicPage, type PublicPlan, type PublicSection, type PublicSettings,
  type PublicTestimonial, type ServiceCard, type TechnologyGroupDto,
} from '@nb/shared';
import { useSiteSettings } from '~/root';
import {
  CardGrid, IndustryCardView, PostCardView, ProductCardView, ProjectCardView, ProjectHighlight, ProjectRow, ServiceCardView,
} from './cards';
import { Icon } from './Icon';
import {
  BrowserFrame, ButtonLink, cx, Eyebrow, Picture, PhoneFrame, Reveal, RichText, Section, SectionHeading, type Tone,
} from './ui';

type Json = Record<string, unknown>;
type Cta = { label?: string; url?: string } | undefined;

const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v : undefined);
const list = <T,>(v: unknown) => (Array.isArray(v) ? (v as T[]) : []);
const hasCta = (c: Cta): c is { label: string; url: string } => !!str(c?.label) && !!str(c?.url);

interface BlockContext {
  media: Record<string, PublicImage>;
  /** Block dau tien cua trang → H1 + anh uu tien tai (LCP). */
  first: boolean;
  align: 'left' | 'center';
}

const image = (ctx: BlockContext, id: unknown) => (typeof id === 'string' ? ctx.media[id] ?? null : null);

// ---------------------------------------------------------------- Trang

/**
 * Render trang Page builder: moi section la 1 <section> voi tone/width/padding tu CMS; block render theo loai.
 * Block khong co du lieu (vd danh gia rong) tu an — khong hien khung trong.
 */
export function PageRenderer({ page }: { page: PublicPage }) {
  let firstUsed = false;
  return (
    <>
      {page.sections.map((section, sIndex) => {
        const blocks = section.blocks.filter((b) => !isEmptyBlock(b));
        if (blocks.length === 0) return null;
        return (
          <SectionView key={sIndex} section={section}>
            {blocks.map((block, bIndex) => {
              const first = !firstUsed;
              firstUsed = true;
              return <BlockView key={bIndex} block={block} ctx={{ media: page.media, first, align: (section.settings.align as 'left' | 'center') ?? 'left' }} />;
            })}
          </SectionView>
        );
      })}
    </>
  );
}

function SectionView({ section, children }: { section: PublicSection; children: ReactNode }) {
  const s = section.settings as Json;
  const hidden = cx(s.hideOnMobile === true && 'max-sm:hidden', s.hideOnDesktop === true && 'sm:hidden');
  const content = <div className="space-y-12 sm:space-y-16">{children}</div>;
  return (
    <Section tone={(str(s.tone) as Tone) ?? 'light'} width={str(s.width)} padding={str(s.padding)} id={str(s.anchorId)}
      className={cx(hidden, str(s.customClass), s.align === 'center' && 'text-center')}>
      {s.animation === 'fade-up' ? <Reveal>{content}</Reveal> : content}
    </Section>
  );
}

function isEmptyBlock(block: PublicBlock) {
  const dynamic = ['PROJECTS', 'PRODUCTS', 'SERVICES', 'INDUSTRIES', 'TESTIMONIALS', 'TEAM', 'BLOG', 'PRICING'];
  if (dynamic.includes(block.type)) return !Array.isArray(block.resolved) || block.resolved.length === 0;
  if (block.type === 'TECH_STACK') return !Array.isArray(block.resolved) || block.resolved.length === 0;
  return false;
}

function BlockView({ block, ctx }: { block: PublicBlock; ctx: BlockContext }) {
  const settings = block.settings as Json;
  const Renderer = renderers[block.type];
  if (!Renderer) return null;
  const node = <Renderer data={block.data as Json} resolved={block.resolved} ctx={ctx} />;
  const className = cx(settings.hideOnMobile === true && 'max-sm:hidden', str(settings.customClass));
  if (settings.animation === 'fade-up') return <Reveal className={className}>{node}</Reveal>;
  return className ? <div className={className}>{node}</div> : node;
}

type Renderer = (props: { data: Json; resolved: unknown; ctx: BlockContext }) => ReactNode;

function Heading({ data, ctx, action }: { data: Json; ctx: BlockContext; action?: ReactNode }) {
  return (
    <SectionHeading eyebrow={str(data.eyebrow)} title={str(data.title)} subtitle={str(data.subtitle)} align={ctx.align}
      as={ctx.first ? 'h1' : 'h2'} action={action} />
  );
}

function MoreLink({ cta }: { cta: Cta }) {
  return hasCta(cta) ? <ButtonLink to={cta.url} variant="secondary" arrow>{cta.label}</ButtonLink> : null;
}

// ---------------------------------------------------------------- Bo cuc & van ban

const Hero: Renderer = ({ data, resolved, ctx }) => {
  const visual = (data.visual ?? {}) as Json;
  const images = visual.source === 'custom'
    ? list<string>(visual.mediaIds).map((id) => image(ctx, id)).filter((x): x is PublicImage => !!x)
    : visual.source === 'none' ? [] : list<PublicImage>(resolved);
  const Title = ctx.first ? 'h1' : 'h2';
  const primary = data.primaryCta as Cta;
  const secondary = data.secondaryCta as Cta;
  return (
    <div className={cx('grid items-center gap-12', images.length > 0 && 'lg:grid-cols-[6fr_6fr] lg:gap-16')}>
      <div className={cx(images.length === 0 && 'mx-auto max-w-4xl text-center')}>
        {str(data.eyebrow) && <Eyebrow className="mb-5">{str(data.eyebrow)}</Eyebrow>}
        {str(data.title) && (
          <Title className="text-4xl leading-[1.08] font-semibold tracking-tight text-balance whitespace-pre-line sm:text-5xl lg:text-[3.5rem]">
            {str(data.title)}
          </Title>
        )}
        {str(data.subtitle) && <p className="mt-6 text-lg leading-8 whitespace-pre-line text-fg-muted sm:text-xl [.tone-dark_&]:text-white/70">{str(data.subtitle)}</p>}
        {(hasCta(primary) || hasCta(secondary)) && (
          <div className={cx('mt-9 flex flex-wrap gap-3', images.length === 0 && 'justify-center')}>
            {hasCta(primary) && <ButtonLink to={primary.url} size="lg" arrow>{primary.label}</ButtonLink>}
            {hasCta(secondary) && <ButtonLink to={secondary.url} size="lg" variant="secondary">{secondary.label}</ButtonLink>}
          </div>
        )}
      </div>
      {images.length > 0 && <HeroMontage images={images} priority={ctx.first} />}
    </div>
  );
};

/** Ghep anh man hinh san pham that: 1 anh lon trong khung trinh duyet + toi da 2 anh nho chong len. */
function HeroMontage({ images, priority }: { images: PublicImage[]; priority: boolean }) {
  const [main, ...rest] = images;
  return (
    <div className="relative pb-10 lg:pb-14">
      <BrowserFrame>
        <Picture image={main} sizes="(min-width: 1024px) 50vw, 100vw" priority={priority} imgClassName="w-full" />
      </BrowserFrame>
      {rest.slice(0, 2).map((img, i) => (
        <div key={img.id} className={cx('absolute bottom-0 hidden w-[42%] sm:block', i === 0 ? '-left-6' : '-right-4 bottom-8 w-[34%]')}>
          <BrowserFrame>
            <Picture image={img} sizes="25vw" imgClassName="w-full" />
          </BrowserFrame>
        </div>
      ))}
    </div>
  );
}

const HeadingBlock: Renderer = ({ data, ctx }) => {
  const Tag = ctx.first ? 'h1' : ((str(data.level) as 'h2' | 'h3') ?? 'h2');
  return (
    <div className={cx('max-w-3xl', ctx.align === 'center' && 'mx-auto')}>
      {str(data.eyebrow) && <Eyebrow className="mb-3">{str(data.eyebrow)}</Eyebrow>}
      {str(data.title) && (
        <Tag className={cx('font-semibold tracking-tight text-balance', Tag === 'h3' ? 'text-2xl' : 'text-3xl leading-tight sm:text-4xl lg:text-[2.75rem]')}>
          {str(data.title)}
        </Tag>
      )}
      {str(data.subtitle) && <p className="mt-4 text-lg leading-relaxed text-fg-muted [.tone-dark_&]:text-white/65">{str(data.subtitle)}</p>}
    </div>
  );
};

const Text: Renderer = ({ data, ctx }) =>
  str(data.text) ? <p className={cx('max-w-3xl text-lg leading-relaxed whitespace-pre-line', ctx.align === 'center' && 'mx-auto')}>{str(data.text)}</p> : null;

const RichTextBlock: Renderer = ({ data, ctx }) => <RichText html={str(data.html)} className={cx('max-w-3xl', ctx.align === 'center' && 'mx-auto')} />;

const CustomHtml: Renderer = ({ data }) => (str(data.html) ? <div dangerouslySetInnerHTML={{ __html: str(data.html)! }} /> : null);

const Spacer: Renderer = ({ data }) => {
  const size: Record<string, string> = { sm: 'h-6', md: 'h-12', lg: 'h-20', xl: 'h-32' };
  return <div aria-hidden className={size[str(data.size) ?? 'md'] ?? size.md} />;
};

const Divider: Renderer = ({ data }) => (
  <hr className={cx('border-border [.tone-dark_&]:border-white/10', data.style === 'dashed' && 'border-dashed')} />
);

const CtaBlock: Renderer = ({ data, ctx }) => {
  const ctas = [data.primaryCta, data.secondaryCta, data.tertiaryCta].map((c) => c as Cta).filter(hasCta);
  const Title = ctx.first ? 'h1' : 'h2';
  return (
    <div className="rounded-2xl bg-dark px-6 py-14 text-center text-white tone-dark sm:px-12 sm:py-20 [.tone-dark_&]:bg-white/[0.04] [.tone-dark_&]:ring-1 [.tone-dark_&]:ring-white/10">
      {str(data.title) && <Title className="mx-auto max-w-3xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{str(data.title)}</Title>}
      {str(data.subtitle) && <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-white/70">{str(data.subtitle)}</p>}
      {ctas.length > 0 && (
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          {ctas.map((c, i) => <ButtonLink key={c.url} to={c.url} size="lg" variant={i === 0 ? 'light' : 'secondary'} arrow={i === 0}>{c.label}</ButtonLink>)}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------- Media

const ImageBlock: Renderer = ({ data, ctx }) => {
  const img = image(ctx, data.mediaId);
  if (!img) return null;
  const frame = str(data.frame) ?? 'none';
  const picture = <Picture image={img} sizes="(min-width: 1280px) 1200px, 100vw" priority={ctx.first} imgClassName={cx('w-full', frame === 'none' && 'rounded-xl')} />;
  const framed = frame === 'browser' ? <BrowserFrame>{picture}</BrowserFrame>
    : frame === 'phone' ? <PhoneFrame className="mx-auto max-w-[320px]">{picture}</PhoneFrame>
      : frame === 'tablet' ? <PhoneFrame className="mx-auto max-w-[720px] rounded-[1.75rem]">{picture}</PhoneFrame>
        : picture;
  const link = str(data.link);
  return (
    <figure>
      {link ? <a href={link}>{framed}</a> : framed}
      {str(data.caption) && <figcaption className="mt-3 text-center text-sm text-fg-muted [.tone-dark_&]:text-white/55">{str(data.caption)}</figcaption>}
    </figure>
  );
};

/** YouTube/Vimeo id → URL nhung (chi tai iframe khi nguoi xem bam — giu trang nhe, muc 30). */
function embedUrl(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}?autoplay=1&rel=0`;
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}?autoplay=1`;
  return null;
}

export function LiteVideo({ url, poster, title }: { url: string; poster?: PublicImage | null; title?: string }) {
  const [playing, setPlaying] = useState(false);
  const embed = embedUrl(url);
  const thumb = !poster && url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/)?.[1];
  if (!embed) return <video src={url} controls preload="metadata" className="aspect-video w-full rounded-xl bg-black" />;
  return (
    <div className="relative aspect-video overflow-hidden rounded-xl bg-dark">
      {playing ? (
        <iframe src={embed} title={title ?? 'Video'} className="absolute inset-0 size-full" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
      ) : (
        <button type="button" onClick={() => setPlaying(true)} className="group absolute inset-0 grid place-items-center" aria-label={`Phát video${title ? `: ${title}` : ''}`}>
          {poster ? <Picture image={poster} sizes="100vw" className="absolute inset-0" imgClassName="size-full object-cover" />
            : thumb ? <img src={`https://i.ytimg.com/vi/${thumb}/hqdefault.jpg`} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" /> : null}
          <span className="relative grid size-16 place-items-center rounded-full bg-white/95 text-dark shadow-lg transition-transform group-hover:scale-105">
            <Play className="ml-1 size-7" aria-hidden fill="currentColor" />
          </span>
        </button>
      )}
    </div>
  );
}

const VideoBlock: Renderer = ({ data, ctx }) => {
  const file = image(ctx, data.mediaId);
  const url = str(data.url) ?? file?.url;
  if (!url) return null;
  return (
    <figure className="mx-auto max-w-5xl">
      <LiteVideo url={url} poster={image(ctx, data.posterMediaId)} title={str(data.caption)} />
      {str(data.caption) && <figcaption className="mt-3 text-center text-sm text-fg-muted">{str(data.caption)}</figcaption>}
    </figure>
  );
};

const Gallery: Renderer = ({ data, ctx }) => {
  const images = list<string>(data.mediaIds).map((id) => image(ctx, id)).filter((x): x is PublicImage => !!x);
  if (images.length === 0) return null;
  return (
    <CardGrid columns={str(data.columns) ?? 3}>
      {images.map((img) => (
        <Picture key={img.id} image={img} sizes="(min-width: 1024px) 33vw, 50vw" imgClassName="aspect-[4/3] w-full rounded-lg border border-border object-cover [.tone-dark_&]:border-white/10" />
      ))}
    </CardGrid>
  );
};

// ---------------------------------------------------------------- Noi dung tinh

const Stats: Renderer = ({ data, ctx }) => {
  const items = list<{ value?: string; label?: string; description?: string }>(data.items).filter((i) => str(i.value));
  if (items.length === 0) return null;
  return (
    <div>
      {str(data.title) && <Heading data={{ title: data.title }} ctx={ctx} />}
      <dl className={cx('grid gap-px overflow-hidden rounded-xl border border-border bg-border [.tone-dark_&]:border-white/10 [.tone-dark_&]:bg-white/10',
        items.length >= 4 ? 'grid-cols-2 lg:grid-cols-4' : items.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2')}>
        {items.map((s, i) => (
          <div key={i} className="bg-bg p-6 sm:p-8 [.tone-dark_&]:bg-dark">
            <dd className="text-3xl font-semibold tracking-tight sm:text-4xl">{s.value}</dd>
            <dt className="mt-2 font-medium">{s.label}</dt>
            {str(s.description) && <p className="mt-1 text-sm text-fg-muted [.tone-dark_&]:text-white/55">{s.description}</p>}
          </div>
        ))}
      </dl>
    </div>
  );
};

const FeatureGrid: Renderer = ({ data, ctx }) => {
  const items = list<{ icon?: string; title?: string; description?: string; link?: string; mediaId?: string }>(data.items).filter((i) => str(i.title));
  if (items.length === 0) return null;
  return (
    <div>
      <Heading data={data} ctx={ctx} />
      <CardGrid columns={str(data.columns) ?? 3}>
        {items.map((f, i) => {
          const img = image(ctx, f.mediaId);
          const body = (
            <>
              {img ? <Picture image={img} sizes="(min-width: 1024px) 33vw, 100vw" imgClassName="mb-5 aspect-[16/10] w-full rounded-lg border border-border object-cover object-top" />
                : <Icon name={f.icon} className="mb-5 size-6 text-primary [.tone-dark_&]:text-accent" fallback={f.icon ? undefined : null} />}
              <h3 className="text-lg font-semibold tracking-tight">{f.title}</h3>
              {str(f.description) && <p className="mt-2 leading-relaxed whitespace-pre-line text-fg-muted [.tone-dark_&]:text-white/65">{f.description}</p>}
            </>
          );
          const cls = 'block h-full rounded-xl border border-border bg-white p-6 text-left [.tone-dark_&]:border-white/10 [.tone-dark_&]:bg-dark-elevated';
          return str(f.link)
            ? <a key={i} href={f.link} className={cx(cls, 'transition-colors hover:border-primary/40')}>{body}</a>
            : <div key={i} className={cls}>{body}</div>;
        })}
      </CardGrid>
    </div>
  );
};

const Timeline: Renderer = ({ data, ctx }) => {
  const items = list<{ title?: string; description?: string; output?: string }>(data.items).filter((i) => str(i.title));
  if (items.length === 0) return null;
  return (
    <div>
      <Heading data={data} ctx={ctx} />
      <ProcessSteps steps={items.map((s) => ({ title: s.title!, description: str(s.description) ?? null, output: str(s.output) ?? null }))} />
    </div>
  );
};

export function ProcessSteps({ steps }: { steps: { title: string; description: string | null; output: string | null }[] }) {
  return (
    <ol className="grid gap-px overflow-hidden rounded-xl border border-border bg-border text-left sm:grid-cols-2 lg:grid-cols-3 [.tone-dark_&]:border-white/10 [.tone-dark_&]:bg-white/10">
      {steps.map((s, i) => (
        <li key={i} className="bg-bg p-6 [.tone-dark_&]:bg-dark">
          <span className="font-mono text-sm text-primary [.tone-dark_&]:text-accent">{String(i + 1).padStart(2, '0')}</span>
          <h3 className="mt-3 text-lg font-semibold tracking-tight">{s.title}</h3>
          {s.description && <p className="mt-2 leading-relaxed whitespace-pre-line text-fg-muted [.tone-dark_&]:text-white/65">{s.description}</p>}
          {s.output && (
            <p className="mt-4 border-t border-border pt-3 text-sm [.tone-dark_&]:border-white/10">
              <span className="font-medium">Đầu ra: </span><span className="text-fg-muted [.tone-dark_&]:text-white/65">{s.output}</span>
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}

export function FaqList({ items, title, as: Tag = 'h2' }: { items: PublicFaq[]; title?: string; as?: 'h1' | 'h2' }) {
  if (items.length === 0) return null;
  return (
    <div className="mx-auto grid max-w-[1100px] gap-10 text-left lg:grid-cols-[1fr_2fr]">
      {title && <Tag className="text-3xl font-semibold tracking-tight">{title}</Tag>}
      <div className="divide-y divide-border border-y border-border [.tone-dark_&]:divide-white/10 [.tone-dark_&]:border-white/10">
        {items.map((f, i) => (
          <details key={i} className="group py-5">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-lg font-medium [&::-webkit-details-marker]:hidden">
              {f.question}
              <Plus className="mt-1 size-5 shrink-0 transition-transform group-open:rotate-45" aria-hidden />
            </summary>
            <div className="mt-3 leading-relaxed whitespace-pre-line text-fg-muted [.tone-dark_&]:text-white/65">{f.answer}</div>
          </details>
        ))}
      </div>
    </div>
  );
}

const Faq: Renderer = ({ data, resolved, ctx }) => {
  const items = data.source === 'global' ? list<PublicFaq>(resolved)
    : list<{ question?: string; answer?: string }>(data.items).filter((f) => str(f.question) && str(f.answer)) as PublicFaq[];
  return <FaqList items={items} title={str(data.title)} as={ctx.first ? 'h1' : 'h2'} />;
};

const Comparison: Renderer = ({ data, ctx }) => {
  const columns = list<string>(data.columns);
  const rows = list<{ label?: string; values?: string[] }>(data.rows).filter((r) => str(r.label));
  if (columns.length === 0 || rows.length === 0) return null;
  const cell = (v: string | undefined) => (v === '✓' || v?.toLowerCase() === 'có'
    ? <Check className="mx-auto size-5 text-primary" aria-label="Có" /> : v ?? '—');
  return (
    <div>
      <Heading data={{ title: data.title }} ctx={ctx} />
      <div className="overflow-x-auto rounded-xl border border-border [.tone-dark_&]:border-white/10">
        <table className="w-full min-w-[560px] text-left">
          <thead className="bg-bg-subtle [.tone-dark_&]:bg-white/5">
            <tr>
              <th scope="col" className="p-4 font-medium text-fg-muted"><span className="sr-only">Tiêu chí</span></th>
              {columns.map((c) => <th key={c} scope="col" className="p-4 text-center font-semibold">{c}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-border [.tone-dark_&]:divide-white/10">
            {rows.map((r, i) => (
              <tr key={i}>
                <th scope="row" className="p-4 font-medium">{r.label}</th>
                {columns.map((_, ci) => <td key={ci} className="p-4 text-center text-fg-muted [.tone-dark_&]:text-white/70">{cell(r.values?.[ci])}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- Du lieu dong

const Projects: Renderer = ({ data, resolved, ctx }) => {
  const projects = list<ProjectCard>(resolved);
  const layout = data.source === 'highlight' ? 'highlight' : str(data.layout) ?? 'grid';
  return (
    <div>
      <Heading data={data} ctx={ctx} action={<MoreLink cta={data.cta as Cta} />} />
      {layout === 'highlight' ? (
        <div className="space-y-20">{projects.map((p) => <ProjectHighlight key={p.id} project={p} />)}</div>
      ) : layout === 'list' ? (
        <div className="border-t border-border text-left [.tone-dark_&]:border-white/10">{projects.map((p) => <ProjectRow key={p.id} project={p} />)}</div>
      ) : (
        <CardGrid className="text-left">{projects.map((p) => <ProjectCardView key={p.id} project={p} />)}</CardGrid>
      )}
    </div>
  );
};

const Products: Renderer = ({ data, resolved, ctx }) => {
  const products = list<ProductCard>(resolved);
  return (
    <div>
      <Heading data={data} ctx={ctx} action={<MoreLink cta={data.cta as Cta} />} />
      <CardGrid columns={Math.min(products.length, 3)} className="text-left">{products.map((p) => <ProductCardView key={p.id} product={p} />)}</CardGrid>
    </div>
  );
};

const Services: Renderer = ({ data, resolved, ctx }) => (
  <div>
    <Heading data={data} ctx={ctx} action={<MoreLink cta={data.cta as Cta} />} />
    <CardGrid className="text-left">{list<ServiceCard>(resolved).map((s) => <ServiceCardView key={s.id} service={s} />)}</CardGrid>
  </div>
);

const Industries: Renderer = ({ data, resolved, ctx }) => (
  <div>
    <Heading data={data} ctx={ctx} />
    <CardGrid columns={4} className="text-left">{list<IndustryCard>(resolved).map((i) => <IndustryCardView key={i.id} industry={i} />)}</CardGrid>
  </div>
);

export function TechGroups({ groups }: { groups: TechnologyGroupDto[] }) {
  return (
    <div className="divide-y divide-border border-y border-border text-left [.tone-dark_&]:divide-white/10 [.tone-dark_&]:border-white/10">
      {groups.map((g) => (
        <div key={g.group} className="grid gap-4 py-6 sm:grid-cols-[200px_1fr]">
          <h3 className="font-mono text-sm tracking-wider text-fg-muted uppercase [.tone-dark_&]:text-white/50">{TechnologyGroupLabels[g.group]}</h3>
          <ul className="flex flex-wrap gap-2">
            {g.items.map((t) => (
              <li key={t.slug} className="inline-flex items-center gap-2 rounded-md border border-border bg-white px-3 py-1.5 text-sm font-medium [.tone-dark_&]:border-white/10 [.tone-dark_&]:bg-white/5">
                {t.logo && <Picture image={t.logo} alt="" sizes="20px" imgClassName="size-5 object-contain" />}
                {t.name}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

const TechStack: Renderer = ({ data, resolved, ctx }) => {
  const groups = list<TechnologyGroupDto>(resolved);
  const capabilities = list<string>(data.capabilities).filter(Boolean);
  return (
    <div>
      <Heading data={{ title: data.title }} ctx={ctx} />
      {data.layout === 'strip' ? (
        <ul className="flex flex-wrap justify-center gap-x-8 gap-y-4">
          {groups.flatMap((g) => g.items).map((t) => (
            <li key={t.slug} className="flex items-center gap-2 font-medium text-fg-muted [.tone-dark_&]:text-white/70">
              {t.logo && <Picture image={t.logo} alt="" sizes="24px" imgClassName="size-6 object-contain" />}{t.name}
            </li>
          ))}
        </ul>
      ) : <TechGroups groups={groups} />}
      {capabilities.length > 0 && (
        <p className="mt-8 flex flex-wrap gap-x-6 gap-y-2 font-mono text-sm text-fg-muted [.tone-dark_&]:text-white/55">
          {capabilities.map((c) => <span key={c}>{c}</span>)}
        </p>
      )}
    </div>
  );
};

const LogoCloud: Renderer = ({ data, resolved, ctx }) => {
  const logos = data.source === 'custom'
    ? list<string>(data.mediaIds).map((id) => image(ctx, id)).filter((x): x is PublicImage => !!x).map((logo) => ({ name: logo.alt ?? '', url: null, logo }))
    : list<{ name: string; url: string | null; logo: PublicImage | null }>(resolved);
  if (logos.length === 0) return null;
  return (
    <div>
      {str(data.title) && <p className="mb-8 text-center text-sm font-medium text-fg-muted [.tone-dark_&]:text-white/55">{str(data.title)}</p>}
      <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
        {logos.map((l, i) => {
          const content = l.logo
            ? <Picture image={l.logo} alt={l.name} sizes="160px" imgClassName="h-8 w-auto object-contain opacity-70 grayscale transition hover:opacity-100 hover:grayscale-0 [.tone-dark_&]:brightness-0 [.tone-dark_&]:invert" />
            : <span className="font-semibold text-fg-muted [.tone-dark_&]:text-white/60">{l.name}</span>;
          return <li key={i}>{l.url ? <a href={l.url} target="_blank" rel="noopener noreferrer" aria-label={l.name}>{content}</a> : content}</li>;
        })}
      </ul>
    </div>
  );
};

export function TestimonialList({ items }: { items: PublicTestimonial[] }) {
  return (
    <CardGrid columns={Math.min(items.length, 3)} className="text-left">
      {items.map((t, i) => (
        <figure key={i} className="flex h-full flex-col rounded-xl border border-border bg-white p-6 [.tone-dark_&]:border-white/10 [.tone-dark_&]:bg-dark-elevated">
          <Quote className="size-6 text-primary/40 [.tone-dark_&]:text-accent/50" aria-hidden />
          <blockquote className="mt-4 flex-1 leading-relaxed whitespace-pre-line">{t.quote}</blockquote>
          <figcaption className="mt-6 flex items-center gap-3">
            {t.avatar && <Picture image={t.avatar} alt="" sizes="40px" imgClassName="size-10 rounded-full object-cover" />}
            <span>
              <span className="block font-semibold">{t.authorName}</span>
              {(t.authorTitle || t.company) && (
                <span className="block text-sm text-fg-muted [.tone-dark_&]:text-white/55">{[t.authorTitle, t.company].filter(Boolean).join(', ')}</span>
              )}
            </span>
          </figcaption>
        </figure>
      ))}
    </CardGrid>
  );
}

const Testimonials: Renderer = ({ data, resolved, ctx }) => (
  <div>
    <Heading data={{ title: data.title }} ctx={ctx} />
    <TestimonialList items={list<PublicTestimonial>(resolved)} />
  </div>
);

const Team: Renderer = ({ data, resolved, ctx }) => {
  const members = list<{ fullName: string; title: string | null; bio: string | null; photo: PublicImage | null }>(resolved);
  return (
    <div>
      <Heading data={data} ctx={ctx} />
      <CardGrid columns={4} className="text-left">
        {members.map((m, i) => (
          <div key={i}>
            {m.photo && <Picture image={m.photo} alt={m.fullName} sizes="(min-width: 1024px) 25vw, 50vw" imgClassName="aspect-[4/5] w-full rounded-xl object-cover" />}
            <p className="mt-4 font-semibold">{m.fullName}</p>
            {m.title && <p className="text-sm text-fg-muted [.tone-dark_&]:text-white/55">{m.title}</p>}
            {m.bio && <p className="mt-2 text-sm leading-relaxed text-fg-muted [.tone-dark_&]:text-white/65">{m.bio}</p>}
          </div>
        ))}
      </CardGrid>
    </div>
  );
};

const Blog: Renderer = ({ data, resolved, ctx }) => (
  <div>
    <Heading data={{ title: data.title, eyebrow: data.eyebrow }} ctx={ctx} action={<MoreLink cta={data.cta as Cta} />} />
    <CardGrid className="text-left">{list<PostCard>(resolved).map((p) => <PostCardView key={p.id} post={p} />)}</CardGrid>
  </div>
);

export function formatPrice(plan: PublicPlan) {
  if (plan.priceAmount == null || plan.billingPeriod === 'CONTACT') return 'Liên hệ';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: plan.currency || 'VND', maximumFractionDigits: 0 }).format(plan.priceAmount);
}

export function PricingTable({ plans }: { plans: PublicPlan[] }) {
  return (
    <CardGrid columns={Math.min(plans.length, 3)} className="text-left">
      {plans.map((p) => (
        <div key={p.name} className={cx('flex h-full flex-col rounded-xl border bg-white p-7 [.tone-dark_&]:bg-dark-elevated',
          p.isHighlighted ? 'border-primary ring-1 ring-primary' : 'border-border [.tone-dark_&]:border-white/10')}>
          <h3 className="text-lg font-semibold">{p.name}</h3>
          <p className="mt-4">
            <span className="text-3xl font-semibold tracking-tight">{formatPrice(p)}</span>
            {p.priceAmount != null && p.billingPeriod !== 'ONE_TIME' && p.billingPeriod !== 'CONTACT' && (
              <span className="text-fg-muted"> / {BillingPeriodLabels[p.billingPeriod].replace('Theo ', '').toLowerCase()}</span>
            )}
          </p>
          {p.priceNote && <p className="mt-1 text-sm text-fg-muted">{p.priceNote}</p>}
          <ul className="mt-6 flex-1 space-y-2.5">
            {p.features.map((f) => <li key={f} className="flex gap-2.5"><Check className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />{f}</li>)}
          </ul>
          <ButtonLink to={p.ctaUrl ?? '/lien-he'} variant={p.isHighlighted ? 'primary' : 'secondary'} className="mt-8 w-full">{p.ctaLabel ?? 'Liên hệ tư vấn'}</ButtonLink>
        </div>
      ))}
    </CardGrid>
  );
}

const Pricing: Renderer = ({ data, resolved, ctx }) => (
  <div>
    <Heading data={data} ctx={ctx} />
    <PricingTable plans={list<PublicPlan>(resolved)} />
  </div>
);

// ---------------------------------------------------------------- Lien he

/**
 * Kenh lien he lay tu Settings. Form thu lead day du (luu CRM, chong spam) thuoc Phase 5;
 * hien tai hien kenh lien he truc tiep — khong hien form gia khong gui duoc.
 */
export function ContactPanel({ settings, title, subtitle, product, as: Tag = 'h2' }: {
  settings: PublicSettings | null; title?: string; subtitle?: string; product?: NamedLink | null; as?: 'h1' | 'h2';
}) {
  const c = settings?.contact;
  const phone = c?.hotline ?? c?.phone;
  const subject = product ? `?subject=${encodeURIComponent(`Yêu cầu demo ${product.name}`)}` : '';
  const channels = [
    phone && { icon: Phone, label: 'Điện thoại', value: phone, href: `tel:${phone.replace(/\s/g, '')}` },
    c?.email && { icon: Mail, label: 'Email', value: c.email, href: `mailto:${c.email}${subject}` },
    (c?.zaloUrl || c?.zaloPhone) && { icon: MessageCircle, label: 'Zalo', value: c?.zaloPhone ?? 'Nhắn Zalo', href: c?.zaloUrl ?? `https://zalo.me/${c!.zaloPhone!.replace(/\D/g, '')}` },
  ].filter(Boolean) as { icon: typeof Phone; label: string; value: string; href: string }[];

  return (
    <div className="grid gap-10 text-left lg:grid-cols-[5fr_7fr] lg:gap-16">
      <div>
        <Tag className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{title ?? 'Trao đổi về dự án của bạn'}</Tag>
        <p className="mt-4 text-lg leading-relaxed text-fg-muted [.tone-dark_&]:text-white/65">
          {subtitle ?? 'Mô tả ngắn nhu cầu, quy mô và thời gian dự kiến. Đội ngũ kỹ thuật sẽ phản hồi để làm rõ yêu cầu và đề xuất hướng triển khai.'}
        </p>
        {c?.workingHours && <p className="mt-6 text-sm text-fg-muted [.tone-dark_&]:text-white/55">Giờ làm việc: {c.workingHours}</p>}
        {c?.address && <p className="mt-2 text-sm text-fg-muted [.tone-dark_&]:text-white/55">{c.address}</p>}
      </div>
      {channels.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2">
          {channels.map((ch) => (
            <li key={ch.label}>
              <a href={ch.href} {...(ch.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className="flex h-full items-start gap-4 rounded-xl border border-border bg-white p-6 transition-colors hover:border-primary/40 [.tone-dark_&]:border-white/10 [.tone-dark_&]:bg-dark-elevated">
                <ch.icon className="mt-0.5 size-5 shrink-0 text-primary [.tone-dark_&]:text-accent" aria-hidden />
                <span>
                  <span className="block text-sm text-fg-muted [.tone-dark_&]:text-white/55">{ch.label}</span>
                  <span className="mt-1 block text-lg font-semibold break-all">{ch.value}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const ContactForm: Renderer = ({ data, resolved, ctx }) => {
  const settings = useSiteSettings();
  return <ContactPanel settings={settings} title={str(data.title)} subtitle={str(data.subtitle)} product={(resolved as NamedLink | null) ?? null}
    as={ctx.first ? 'h1' : 'h2'} />;
};

const renderers: Record<string, Renderer> = {
  HERO: Hero, HEADING: HeadingBlock, TEXT: Text, RICH_TEXT: RichTextBlock, IMAGE: ImageBlock, VIDEO: VideoBlock, GALLERY: Gallery,
  STATS: Stats, LOGO_CLOUD: LogoCloud, FEATURE_GRID: FeatureGrid, PROJECTS: Projects, PRODUCTS: Products, SERVICES: Services,
  INDUSTRIES: Industries, TECH_STACK: TechStack, TESTIMONIALS: Testimonials, TEAM: Team, TIMELINE: Timeline, FAQ: Faq, CTA: CtaBlock,
  CONTACT_FORM: ContactForm, PRICING: Pricing, COMPARISON: Comparison, BLOG: Blog, CUSTOM_HTML: CustomHtml, SPACER: Spacer, DIVIDER: Divider,
};
