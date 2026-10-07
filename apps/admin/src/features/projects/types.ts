import type {
  CommercialType, ContentStatus, OwnershipType, ProjectContentType, ProjectLinkKind, ProjectMediaKind, ProjectRole,
  ProjectState, SeoMeta,
} from '@nb/shared';

export interface ProjectInput {
  name: string;
  slug: string | null;
  shortDescription: string | null;
  shortResult: string | null;
  clientId: string | null;
  industryId: string | null;
  productId: string | null;
  primaryContentType: ProjectContentType;
  contentTypes: ProjectContentType[];
  commercialType: CommercialType;
  projectRoles: ProjectRole[];
  ownershipType: OwnershipType;
  projectOwner: string | null;
  nguyenBinhContribution: string | null;
  publicCreditText: string | null;
  canShowClient: boolean;
  canShowClientLogo: boolean;
  canShowScreenshots: boolean;
  canShowMetrics: boolean;
  canShowTechnology: boolean;
  canShowLiveUrl: boolean;
  overview: string | null;
  problem: string | null;
  requirements: string | null;
  solution: string | null;
  architecture: string | null;
  architectureMediaId: string | null;
  challenge: string | null;
  challengeSolution: string | null;
  result: string | null;
  startDate: string | null;
  endDate: string | null;
  launchDate: string | null;
  projectState: ProjectState;
  websiteUrl: string | null;
  demoUrl: string | null;
  androidUrl: string | null;
  iosUrl: string | null;
  githubUrl: string | null;
  qrMediaId: string | null;
  coverMediaId: string | null;
  thumbnailMediaId: string | null;
  isFeatured: boolean;
  featuredOrder: number;
  sortOrder: number;
  categoryIds: string[];
  technologies: { technologyId: string; note: string | null }[];
  features: { title: string; description: string | null; icon: string | null; mediaId: string | null; isPublic: boolean }[];
  media: {
    kind: ProjectMediaKind; mediaId: string | null; externalUrl: string | null; caption: string | null; alt: string | null;
    groupKey: string | null; isPublic: boolean;
  }[];
  metrics: { label: string; value: string; unit: string | null; description: string | null }[];
  links: { kind: ProjectLinkKind; label: string | null; url: string }[];
  seo: SeoMeta;
}

export interface ProjectListItem {
  id: string;
  name: string;
  slug: string;
  primaryContentType: ProjectContentType;
  contentTypes: ProjectContentType[];
  projectRoles: ProjectRole[];
  ownershipType: OwnershipType;
  industryName: string | null;
  clientName: string | null;
  coverMediaId: string | null;
  isFeatured: boolean;
  featuredOrder: number;
  sortOrder: number;
  status: ContentStatus;
  publishAt: string | null;
  updatedAt: string | null;
}

export const emptyProject: ProjectInput = {
  name: '', slug: null, shortDescription: null, shortResult: null, clientId: null, industryId: null, productId: null,
  primaryContentType: 'CUSTOM_PROJECT', contentTypes: [], commercialType: 'CUSTOM_DEVELOPMENT', projectRoles: [],
  ownershipType: 'UNDISCLOSED', projectOwner: null, nguyenBinhContribution: null, publicCreditText: null,
  canShowClient: false, canShowClientLogo: false, canShowScreenshots: true, canShowMetrics: false, canShowTechnology: true,
  canShowLiveUrl: false, overview: null, problem: null, requirements: null, solution: null, architecture: null,
  architectureMediaId: null, challenge: null, challengeSolution: null, result: null, startDate: null, endDate: null,
  launchDate: null, projectState: 'LIVE', websiteUrl: null, demoUrl: null, androidUrl: null, iosUrl: null, githubUrl: null,
  qrMediaId: null, coverMediaId: null, thumbnailMediaId: null, isFeatured: false, featuredOrder: 0, sortOrder: 0,
  categoryIds: [], technologies: [], features: [], media: [], metrics: [], links: [], seo: {},
};

/** Cau ghi nhan mac dinh cho du an khong thuoc so huu Nguyen Binh (muc 25). */
export const DefaultClientCredit = 'Nguyên Bình tham gia phát triển và triển khai hệ thống theo yêu cầu của khách hàng.';
