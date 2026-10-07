/** Enum noi dung (khop backend, dang UPPER_SNAKE) + nhan tieng Viet. */

export type ContentStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'UNPUBLISHED' | 'ARCHIVED';

export const ContentStatusLabels: Record<ContentStatus, string> = {
  DRAFT: 'Bản nháp',
  SCHEDULED: 'Đã lên lịch',
  PUBLISHED: 'Đã xuất bản',
  UNPUBLISHED: 'Đã gỡ',
  ARCHIVED: 'Lưu trữ',
};

export const ProjectContentTypeLabels = {
  CUSTOM_PROJECT: 'Dự án theo yêu cầu',
  OWN_PRODUCT: 'Sản phẩm của Nguyên Bình',
  COMMERCIAL_PRODUCT: 'Sản phẩm thương mại',
  INTERNAL_PRODUCT: 'Sản phẩm nội bộ',
  PARTNER_SOLUTION: 'Giải pháp đối tác',
  CASE_STUDY: 'Case study',
  WEBSITE: 'Website',
  MOBILE_APP: 'Mobile App',
  SAAS: 'SaaS',
  ENTERPRISE_SOFTWARE: 'Phần mềm doanh nghiệp',
  ECOMMERCE: 'Thương mại điện tử',
  POS: 'POS',
  PMS: 'PMS',
  ERP: 'ERP',
  HRM: 'HRM',
  OTHER: 'Khác',
} as const;
export type ProjectContentType = keyof typeof ProjectContentTypeLabels;

export const CommercialTypeLabels = {
  FOR_SALE: 'Đang bán',
  CUSTOM_DEVELOPMENT: 'Phát triển theo yêu cầu',
  LICENSE: 'Bản quyền',
  SAAS_SUBSCRIPTION: 'Thuê bao SaaS',
  IMPLEMENTATION_SERVICE: 'Dịch vụ triển khai',
  INTERNAL_ONLY: 'Chỉ dùng nội bộ',
  SHOWCASE_ONLY: 'Chỉ giới thiệu',
  CONTACT_FOR_PRICE: 'Liên hệ báo giá',
} as const;
export type CommercialType = keyof typeof CommercialTypeLabels;

export const ProjectRoleLabels = {
  OWNER: 'Chủ sở hữu',
  DEVELOPER: 'Phát triển phần mềm theo yêu cầu',
  CO_DEVELOPER: 'Đồng phát triển',
  TECHNICAL_PARTNER: 'Đối tác kỹ thuật',
  IMPLEMENTATION_PARTNER: 'Đối tác triển khai',
  OUTSOURCING: 'Outsourcing',
  MAINTENANCE: 'Bảo trì',
  UI_UX: 'UI/UX',
  BACKEND: 'Backend',
  FRONTEND: 'Frontend',
  MOBILE: 'Mobile',
  FULLSTACK: 'Fullstack',
  OTHER: 'Khác',
} as const;
export type ProjectRole = keyof typeof ProjectRoleLabels;

export const OwnershipTypeLabels = {
  UNDISCLOSED: 'Chưa cấu hình',
  NGUYEN_BINH_OWNED: 'Nguyên Bình sở hữu',
  CLIENT_OWNED: 'Khách hàng sở hữu',
  CO_OWNED: 'Đồng sở hữu',
  PARTNER_OWNED: 'Đối tác sở hữu',
} as const;
export type OwnershipType = keyof typeof OwnershipTypeLabels;

export const ProjectStateLabels = {
  IN_PROGRESS: 'Đang thực hiện',
  LIVE: 'Đang vận hành',
  MAINTENANCE: 'Đang bảo trì',
  ENDED: 'Đã kết thúc',
} as const;
export type ProjectState = keyof typeof ProjectStateLabels;

export const ProjectMediaKindLabels = {
  DESKTOP: 'Màn hình desktop',
  MOBILE: 'Màn hình mobile',
  DASHBOARD: 'Dashboard',
  BEFORE: 'Trước (before)',
  AFTER: 'Sau (after)',
  GALLERY: 'Thư viện ảnh',
  VIDEO: 'Video (file)',
  YOU_TUBE: 'YouTube',
  VIMEO: 'Vimeo',
  EXTERNAL_VIDEO: 'Video link ngoài',
  ARCHITECTURE: 'Sơ đồ kiến trúc',
  PDF: 'PDF',
  CLIENT_LOGO: 'Logo khách hàng',
  FEATURE: 'Ảnh tính năng',
} as const;
export type ProjectMediaKind = keyof typeof ProjectMediaKindLabels;
export const ExternalVideoKinds: ProjectMediaKind[] = ['YOU_TUBE', 'VIMEO', 'EXTERNAL_VIDEO'];

export const ProjectLinkKindLabels = {
  WEBSITE: 'Website',
  APP_STORE: 'App Store',
  GOOGLE_PLAY: 'Google Play',
  DEMO: 'Demo',
  DOCS: 'Tài liệu',
  OTHER: 'Khác',
} as const;
export type ProjectLinkKind = keyof typeof ProjectLinkKindLabels;

export const ProductTypeLabels = {
  POS: 'POS', PMS: 'PMS', ERP: 'ERP', HRM: 'HRM', CRM: 'CRM', SAAS: 'SaaS', MOBILE: 'Mobile', OTHER: 'Khác',
} as const;
export type ProductType = keyof typeof ProductTypeLabels;

export const BillingPeriodLabels = {
  ONE_TIME: 'Một lần',
  MONTHLY: 'Theo tháng',
  YEARLY: 'Theo năm',
  CONTACT: 'Liên hệ',
} as const;
export type BillingPeriod = keyof typeof BillingPeriodLabels;

export const TechnologyGroupLabels = {
  BACKEND: 'Backend',
  FRONTEND: 'Frontend',
  MOBILE: 'Mobile',
  DATA: 'Data',
  INFRASTRUCTURE: 'Infrastructure',
  OTHER: 'Khác',
} as const;
export type TechnologyGroup = keyof typeof TechnologyGroupLabels;

export const FaqScopeLabels = {
  GLOBAL: 'Chung',
  SERVICE: 'Dịch vụ',
  SOLUTION: 'Giải pháp',
  PRODUCT: 'Sản phẩm',
} as const;
export type FaqScope = keyof typeof FaqScopeLabels;

export const PageTypeLabels = {
  HOME: 'Trang chủ',
  STANDARD: 'Trang thường',
  LANDING: 'Landing SEO',
  SOLUTION: 'Giải pháp theo ngành',
  LEGAL: 'Pháp lý',
} as const;
export type PageType = keyof typeof PageTypeLabels;

export interface SeoMeta {
  title?: string | null;
  description?: string | null;
  canonicalUrl?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImageId?: string | null;
  twitterImageId?: string | null;
  robots?: string | null;
  schemaJson?: string | null;
  excludeFromSitemap?: boolean;
}

export interface ContentMeta {
  id: string;
  status: ContentStatus;
  publishAt: string | null;
  publishedAt: string | null;
  isPublic: boolean;
  isDeleted: boolean;
  rowVersion: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface ContentDetail<T> {
  meta: ContentMeta;
  data: T;
}

export interface ContentVersion {
  id: string;
  version: number;
  isAutosave: boolean;
  note: string | null;
  createdBy: string | null;
  createdByName: string | null;
  createdAt: string;
}

export interface BulkResult {
  succeeded: number;
  failed: { id: string; message: string }[];
}

export interface LookupItem {
  id: string;
  name: string;
  extra: string | null;
}

export interface Lookups {
  industries: LookupItem[];
  technologies: LookupItem[];
  clients: LookupItem[];
  projectCategories: LookupItem[];
  productCategories: LookupItem[];
  serviceCategories: LookupItem[];
  postCategories: LookupItem[];
  tags: LookupItem[];
  authors: LookupItem[];
  products: LookupItem[];
  projects: LookupItem[];
  services: LookupItem[];
  solutionPages: LookupItem[];
}

export function optionsOf<T extends Record<string, string>>(labels: T) {
  return (Object.keys(labels) as (keyof T & string)[]).map((value) => ({ value, label: labels[value] }));
}
