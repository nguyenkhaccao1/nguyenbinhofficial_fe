/** Kieu du lieu API public (khop Application/Public/PublicContracts.cs). */
import type {
  BillingPeriod, CommercialType, PageType, ProductType, ProjectContentType, ProjectLinkKind, ProjectMediaKind, ProjectRole,
  ProjectState, TechnologyGroup,
} from './content';

export interface PublicImageSource {
  format: 'avif' | 'webp' | string;
  width: number;
  url: string;
}

export interface PublicImage {
  id: string;
  url: string;
  alt: string | null;
  width: number | null;
  height: number | null;
  blurDataUrl: string | null;
  sources: PublicImageSource[];
}

export interface PublicSeo {
  title: string | null;
  description: string | null;
  canonicalUrl: string | null;
  robots: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  twitterImage: string | null;
  schemaJson: string | null;
}

export interface NamedLink {
  name: string;
  slug: string;
}

export interface ProjectCard {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  shortResult: string | null;
  industryName: string | null;
  primaryContentType: ProjectContentType;
  contentTypes: ProjectContentType[];
  projectRoles: ProjectRole[];
  isOwnProduct: boolean;
  creditText: string | null;
  technologies: string[];
  image: PublicImage | null;
  year: number | null;
  problemExcerpt: string | null;
  solutionExcerpt: string | null;
  resultExcerpt: string | null;
}

export interface PublicTechnology {
  name: string;
  slug: string;
  group: TechnologyGroup;
  logo: PublicImage | null;
  description: string | null;
}

export interface PublicFeature {
  title: string;
  description: string | null;
  icon: string | null;
  image: PublicImage | null;
}

export interface PublicProjectMedia {
  kind: ProjectMediaKind;
  image: PublicImage | null;
  externalUrl: string | null;
  fileUrl: string | null;
  caption: string | null;
  alt: string | null;
  groupKey: string | null;
}

export interface ProjectDetail {
  card: ProjectCard;
  client: { name: string; logo: PublicImage | null; websiteUrl: string | null } | null;
  industry: NamedLink | null;
  product: NamedLink | null;
  commercialType: CommercialType;
  projectState: ProjectState;
  nguyenBinhContribution: string | null;
  overview: string | null;
  problem: string | null;
  requirements: string | null;
  solution: string | null;
  architecture: string | null;
  architectureImage: PublicImage | null;
  challenge: string | null;
  challengeSolution: string | null;
  result: string | null;
  startDate: string | null;
  endDate: string | null;
  launchDate: string | null;
  features: PublicFeature[];
  media: PublicProjectMedia[];
  metrics: { label: string; value: string; unit: string | null; description: string | null }[];
  links: { kind: ProjectLinkKind; label: string | null; url: string }[];
  technologies: PublicTechnology[];
  cover: PublicImage | null;
  qr: PublicImage | null;
  related: ProjectCard[];
  seo: PublicSeo;
  updatedAt: string | null;
}

export interface ProductCard {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  shortDescription: string | null;
  productType: ProductType;
  logo: PublicImage | null;
  hero: PublicImage | null;
}

export interface PublicPlan {
  name: string;
  priceAmount: number | null;
  currency: string;
  billingPeriod: BillingPeriod;
  priceNote: string | null;
  features: string[];
  isHighlighted: boolean;
  ctaLabel: string | null;
  ctaUrl: string | null;
}

export interface PublicFaq {
  question: string;
  answer: string;
}

export interface PublicTestimonial {
  authorName: string;
  authorTitle: string | null;
  company: string | null;
  avatar: PublicImage | null;
  quote: string;
  rating: number | null;
}

export interface ProductDetail {
  card: ProductCard;
  description: string | null;
  commercialType: CommercialType;
  problem: string | null;
  solution: string | null;
  targetUsers: string | null;
  integration: string | null;
  deployment: string | null;
  security: string | null;
  demoVideoUrl: string | null;
  demoUrl: string | null;
  pricingNote: string | null;
  features: PublicFeature[];
  modules: { name: string; description: string | null; icon: string | null; image: PublicImage | null; items: string[] }[];
  media: PublicProjectMedia[];
  plans: PublicPlan[];
  faqs: PublicFaq[];
  testimonials: PublicTestimonial[];
  caseStudies: ProjectCard[];
  seo: PublicSeo;
  updatedAt: string | null;
}

export interface ServiceCard {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  shortDescription: string | null;
  categoryName: string | null;
  cover: PublicImage | null;
}

export interface ServiceDetail {
  card: ServiceCard;
  description: string | null;
  deliverables: string | null;
  process: { title: string; description: string | null; output: string | null }[];
  features: PublicFeature[];
  technologies: PublicTechnology[];
  relatedProjects: ProjectCard[];
  faqs: PublicFaq[];
  otherServices: ServiceCard[];
  seo: PublicSeo;
  updatedAt: string | null;
}

export interface ServiceGroup {
  categoryName: string | null;
  categorySlug: string | null;
  services: ServiceCard[];
}

export interface IndustryCard {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  solutionPath: string | null;
  projectCount: number;
}

export interface TechnologyGroupDto {
  group: TechnologyGroup;
  items: PublicTechnology[];
}

export interface PostCard {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover: PublicImage | null;
  authorName: string | null;
  publishedAt: string | null;
  readingMinutes: number;
  category: NamedLink | null;
}

export interface PostDetail {
  card: PostCard;
  contentHtml: string | null;
  author: { name: string; slug: string; title: string | null; bio: string | null; avatar: PublicImage | null; links: string[] } | null;
  categories: NamedLink[];
  tags: NamedLink[];
  related: PostCard[];
  seo: PublicSeo;
  updatedAt: string | null;
}

export interface BlogCategory {
  name: string;
  slug: string;
  description: string | null;
  postCount: number;
  seo: PublicSeo;
}

export interface BlogResolveResult {
  kind: 'post' | 'category';
  post: PostDetail | null;
  category: BlogCategory | null;
}

export interface PublicBlock {
  type: string;
  data: Record<string, unknown>;
  settings: Record<string, unknown>;
  resolved: unknown;
}

export interface PublicSection {
  name: string | null;
  settings: Record<string, unknown>;
  blocks: PublicBlock[];
}

export interface PublicPage {
  id: string;
  title: string;
  path: string;
  pageType: PageType;
  industry: NamedLink | null;
  sections: PublicSection[];
  media: Record<string, PublicImage>;
  seo: PublicSeo;
  updatedAt: string | null;
}

export interface NavMegaItem {
  /** Ten nhom (vd nhom dich vu) — megamenu chia cot theo nhom. */
  group?: string | null;
  label: string;
  url: string;
  description: string | null;
  icon: string | null;
}

export interface NavItem {
  label: string;
  url: string | null;
  description: string | null;
  openInNewTab: boolean;
  children: NavItem[];
  megaSource: string | null;
  mega: NavMegaItem[];
}

export interface Navigation {
  header: NavItem[];
  footerCompany: NavItem[];
  footerTechnology: NavItem[];
  footerLegal: NavItem[];
  products: NavMegaItem[];
  services: NavMegaItem[];
  solutions: NavMegaItem[];
}

export interface SearchHit {
  kind: 'product' | 'project' | 'service' | 'post';
  title: string;
  url: string;
  excerpt: string | null;
  image: PublicImage | null;
}

export interface SearchResult {
  query: string;
  hits: SearchHit[];
}
