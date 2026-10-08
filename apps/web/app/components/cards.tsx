import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router';
import {
  formatDate, ProductTypeLabels, ProjectContentTypeLabels, ProjectRoleLabels, type IndustryCard, type PostCard, type ProductCard,
  type ProjectCard, type ServiceCard,
} from '@nb/shared';
import { Icon } from './Icon';
import { Badge, BrowserFrame, cx, ImagePlaceholder, Picture, TechChip } from './ui';

/**
 * Nhan quyen so huu (muc 10–12): chi du an Nguyen Binh so huu moi ghi "San pham cua Nguyen Binh";
 * du an khach hang hien vai tro/ghi cong cua Nguyen Binh.
 */
export function OwnershipLabel({ project, className }: { project: ProjectCard; className?: string }) {
  const text = project.isOwnProduct
    ? 'Sản phẩm của Nguyên Bình'
    : project.creditText ?? (project.projectRoles.length > 0
      ? `Nguyên Bình: ${project.projectRoles.slice(0, 2).map((r) => ProjectRoleLabels[r]).join(', ')}`
      : null);
  if (!text) return null;
  return (
    <p className={cx('text-xs font-medium', project.isOwnProduct ? 'text-primary [.tone-dark_&]:text-accent' : 'text-fg-muted [.tone-dark_&]:text-white/60', className)}>
      {text}
    </p>
  );
}

export function ProjectCardView({ project, priority }: { project: ProjectCard; priority?: boolean }) {
  return (
    <Link to={`/du-an/${project.slug}`} prefetch="intent"
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-white transition-shadow hover:shadow-[0_16px_40px_-20px_rgba(10,13,20,0.3)] [.tone-dark_&]:border-white/10 [.tone-dark_&]:bg-dark-elevated">
      <div className="aspect-[16/10] overflow-hidden border-b border-border bg-bg-subtle [.tone-dark_&]:border-white/10">
        {project.image
          ? <Picture image={project.image} alt={project.name} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" priority={priority}
            imgClassName="size-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]" />
          : <ImagePlaceholder label={project.name} className="size-full" />}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          {/* Du an so huu: nhan "San pham cua Nguyen Binh" da hien o OwnershipLabel → khong lap lai. */}
          {!project.isOwnProduct && <Badge>{ProjectContentTypeLabels[project.primaryContentType]}</Badge>}
          {project.industryName && <Badge>{project.industryName}</Badge>}
        </div>
        <h3 className="text-xl font-semibold tracking-tight">{project.name}</h3>
        {project.shortDescription && <p className="line-clamp-3 leading-relaxed text-fg-muted [.tone-dark_&]:text-white/65">{project.shortDescription}</p>}
        {project.shortResult && <p className="text-sm font-medium">{project.shortResult}</p>}
        <div className="mt-auto space-y-3 pt-2">
          {project.technologies.length > 0 && (
            <p className="flex flex-wrap gap-x-3 gap-y-1">{project.technologies.slice(0, 5).map((t) => <TechChip key={t}>{t}</TechChip>)}</p>
          )}
          <div className="flex items-center justify-between gap-3">
            <OwnershipLabel project={project} />
            <ArrowUpRight className="size-5 shrink-0 text-fg-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
          </div>
        </div>
      </div>
    </Link>
  );
}

/** Case study lon: anh ben phai, van de → giai phap → ket qua ben trai. */
export function ProjectHighlight({ project }: { project: ProjectCard }) {
  const rows = [
    ['Vấn đề', project.problemExcerpt],
    ['Giải pháp', project.solutionExcerpt],
    ['Kết quả', project.resultExcerpt ?? project.shortResult],
  ].filter(([, v]) => v) as [string, string][];
  return (
    <div className="grid items-center gap-10 lg:grid-cols-[5fr_7fr] lg:gap-16">
      <div>
        <OwnershipLabel project={project} className="mb-3 text-sm" />
        <h3 className="text-3xl font-semibold tracking-tight sm:text-4xl">{project.name}</h3>
        {project.shortDescription && <p className="mt-4 text-lg leading-relaxed text-fg-muted [.tone-dark_&]:text-white/65">{project.shortDescription}</p>}
        {rows.length > 0 && (
          <dl className="mt-8 space-y-5 border-l border-border pl-5 [.tone-dark_&]:border-white/15">
            {rows.map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs font-semibold tracking-wider text-fg-muted uppercase [.tone-dark_&]:text-white/50">{k}</dt>
                <dd className="mt-1 leading-relaxed">{v}</dd>
              </div>
            ))}
          </dl>
        )}
        {project.technologies.length > 0 && (
          <p className="mt-6 flex flex-wrap gap-x-3 gap-y-1">{project.technologies.map((t) => <TechChip key={t}>{t}</TechChip>)}</p>
        )}
        <Link to={`/du-an/${project.slug}`} prefetch="intent" className="mt-8 inline-flex items-center gap-2 font-medium text-primary hover:underline [.tone-dark_&]:text-accent">
          Xem case study <ArrowUpRight className="size-4" aria-hidden />
        </Link>
      </div>
      {project.image ? (
        <BrowserFrame>
          <Picture image={project.image} alt={project.name} sizes="(min-width: 1024px) 58vw, 100vw" imgClassName="w-full" />
        </BrowserFrame>
      ) : <ImagePlaceholder label={project.name} className="aspect-[16/10] rounded-xl" />}
    </div>
  );
}

export function ProjectRow({ project }: { project: ProjectCard }) {
  return (
    <Link to={`/du-an/${project.slug}`} prefetch="intent"
      className="group grid gap-2 border-b border-border py-6 sm:grid-cols-[1fr_2fr_auto] sm:items-center sm:gap-8 [.tone-dark_&]:border-white/10">
      <div>
        <h3 className="text-lg font-semibold tracking-tight group-hover:text-primary">{project.name}</h3>
        <OwnershipLabel project={project} className="mt-1" />
      </div>
      <p className="text-fg-muted [.tone-dark_&]:text-white/65">{project.shortDescription}</p>
      <ArrowUpRight className="hidden size-5 text-fg-muted sm:block" aria-hidden />
    </Link>
  );
}

export function ProductCardView({ product }: { product: ProductCard }) {
  return (
    <Link to={`/san-pham/${product.slug}`} prefetch="intent"
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-white transition-shadow hover:shadow-[0_16px_40px_-20px_rgba(10,13,20,0.3)] [.tone-dark_&]:border-white/10 [.tone-dark_&]:bg-dark-elevated">
      {product.hero && (
        <div className="aspect-[16/10] overflow-hidden border-b border-border bg-bg-subtle [.tone-dark_&]:border-white/10">
          <Picture image={product.hero} alt={product.name} sizes="(min-width: 1024px) 33vw, 100vw" imgClassName="size-full object-cover object-top" />
        </div>
      )}
      <div className="flex flex-1 flex-col gap-3 p-6">
        <div className="flex items-center gap-3">
          {product.logo && <Picture image={product.logo} alt="" sizes="40px" imgClassName="size-10 rounded-md object-contain" />}
          <Badge>{ProductTypeLabels[product.productType]}</Badge>
        </div>
        <h3 className="text-xl font-semibold tracking-tight">{product.name}</h3>
        {product.tagline && <p className="font-medium">{product.tagline}</p>}
        {product.shortDescription && <p className="leading-relaxed text-fg-muted [.tone-dark_&]:text-white/65">{product.shortDescription}</p>}
        <span className="mt-auto inline-flex items-center gap-1.5 pt-2 text-sm font-medium text-primary [.tone-dark_&]:text-accent">
          Xem sản phẩm <ArrowUpRight className="size-4" aria-hidden />
        </span>
      </div>
    </Link>
  );
}

export function ServiceCardView({ service }: { service: ServiceCard }) {
  return (
    <Link to={`/dich-vu/${service.slug}`} prefetch="intent"
      className="group flex h-full flex-col gap-4 overflow-hidden rounded-xl border border-border bg-white p-6 transition-colors hover:border-primary/40 [.tone-dark_&]:border-white/10 [.tone-dark_&]:bg-dark-elevated [.tone-dark_&]:hover:border-white/25">
      {service.cover && (
        <div className="-mx-6 -mt-6 mb-1 aspect-[16/9] overflow-hidden border-b border-border bg-bg-subtle [.tone-dark_&]:border-white/10">
          <Picture image={service.cover} alt={service.name} sizes="(min-width: 1024px) 33vw, 100vw" imgClassName="size-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
        </div>
      )}
      <span className="grid size-11 place-items-center rounded-lg bg-primary/8 text-primary [.tone-dark_&]:bg-white/8 [.tone-dark_&]:text-accent">
        <Icon name={service.icon} className="size-5" />
      </span>
      <h3 className="text-lg font-semibold tracking-tight">{service.name}</h3>
      {service.shortDescription && <p className="leading-relaxed text-fg-muted [.tone-dark_&]:text-white/65">{service.shortDescription}</p>}
      <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-medium text-primary [.tone-dark_&]:text-accent">
        Chi tiết <ArrowUpRight className="size-4" aria-hidden />
      </span>
    </Link>
  );
}

export function IndustryCardView({ industry }: { industry: IndustryCard }) {
  const body = (
    <>
      <Icon name={industry.icon} className="size-6 text-primary [.tone-dark_&]:text-accent" />
      <h3 className="mt-4 text-lg font-semibold tracking-tight">{industry.name}</h3>
      {industry.description && <p className="mt-2 leading-relaxed text-fg-muted [.tone-dark_&]:text-white/65">{industry.description}</p>}
      {industry.projectCount > 0 && <p className="mt-4 text-sm text-fg-muted [.tone-dark_&]:text-white/50">{industry.projectCount} dự án</p>}
    </>
  );
  const classes = 'block h-full rounded-xl border border-border bg-white p-6 [.tone-dark_&]:border-white/10 [.tone-dark_&]:bg-dark-elevated';
  const to = industry.solutionPath ?? (industry.projectCount > 0 ? `/du-an?nganh=${industry.slug}` : null);
  return to ? <Link to={to} prefetch="intent" className={cx(classes, 'transition-colors hover:border-primary/40')}>{body}</Link> : <div className={classes}>{body}</div>;
}

export function PostCardView({ post }: { post: PostCard }) {
  return (
    <Link to={`/blog/${post.slug}`} prefetch="intent" className="group flex h-full flex-col">
      <div className="aspect-[16/9] overflow-hidden rounded-xl border border-border bg-bg-subtle [.tone-dark_&]:border-white/10">
        {post.cover
          ? <Picture image={post.cover} alt={post.title} sizes="(min-width: 1024px) 33vw, 100vw" imgClassName="size-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
          : <ImagePlaceholder label={post.category?.name ?? 'Blog'} className="size-full" />}
      </div>
      <div className="flex flex-1 flex-col pt-5">
        <p className="text-sm text-fg-muted [.tone-dark_&]:text-white/55">
          {post.category && <span className="font-medium text-primary [.tone-dark_&]:text-accent">{post.category.name} · </span>}
          {post.publishedAt && <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>} · {post.readingMinutes} phút đọc
        </p>
        <h3 className="mt-2 text-xl font-semibold tracking-tight group-hover:text-primary">{post.title}</h3>
        {post.excerpt && <p className="mt-2 line-clamp-3 leading-relaxed text-fg-muted [.tone-dark_&]:text-white/65">{post.excerpt}</p>}
      </div>
    </Link>
  );
}

export function CardGrid({ children, columns = 3, className }: { children: React.ReactNode; columns?: number | string; className?: string }) {
  const cols: Record<string, string> = {
    1: '',
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-2 lg:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-4',
  };
  return <div className={cx('grid gap-6', cols[String(columns)] ?? cols[3], className)}>{children}</div>;
}
