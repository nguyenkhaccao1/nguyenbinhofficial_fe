import { FaqScopeLabels, optionsOf, TechnologyGroupLabels, type FaqScope, type SeoMeta, type TechnologyGroup } from '@nb/shared';
import type { DialogCrudConfig, FieldConfig } from '@/components/content/DialogCrudPage';
import { Badge } from '@/components/ui/Feedback';

/** Truong form chung cua danh muc (khop TaxonomyInput o backend). */
export interface TaxonomyInput {
  name: string;
  slug: string | null;
  description: string | null;
  sortOrder: number;
  icon: string | null;
  group: TechnologyGroup | null;
  logoMediaId: string | null;
  websiteUrl: string | null;
  showOnTechPage: boolean;
  industryId: string | null;
  parentId: string | null;
  title: string | null;
  avatarMediaId: string | null;
  links: string[];
  seo: SeoMeta | null;
}

const emptyTaxonomy: TaxonomyInput = {
  name: '', slug: null, description: null, sortOrder: 0, icon: null, group: null, logoMediaId: null, websiteUrl: null,
  showOnTechPage: true, industryId: null, parentId: null, title: null, avatarMediaId: null, links: [], seo: {},
};

const base: FieldConfig[] = [
  { name: 'name', label: 'Tên', type: 'text', required: true },
  { name: 'slug', label: 'Slug', type: 'text', hint: 'Để trống để tự tạo từ tên.' },
  { name: 'description', label: 'Mô tả', type: 'textarea' },
];
const order: FieldConfig = { name: 'sortOrder', label: 'Thứ tự', type: 'number' };
const seo: FieldConfig = { name: 'seo', label: 'SEO (tuỳ chọn)', type: 'seo' };

function taxonomy(config: Omit<DialogCrudConfig<TaxonomyInput>, 'empty' | 'publishable' | 'titleField'>): DialogCrudConfig<TaxonomyInput> {
  return { ...config, empty: emptyTaxonomy, publishable: false, titleField: 'name' };
}

export const taxonomyConfigs = {
  industries: taxonomy({
    resource: 'industries', permission: 'project', title: 'Ngành', label: 'ngành',
    description: 'Dùng cho dự án và landing giải pháp /giai-phap/{slug}.',
    fields: [...base, { name: 'icon', label: 'Icon (tên lucide)', type: 'text', hint: 'vd: utensils, hotel, store' }, order, seo],
  }),
  technologies: taxonomy({
    resource: 'technologies', permission: 'project', title: 'Công nghệ', label: 'công nghệ',
    description: 'Chỉ liệt kê công nghệ thực sự có năng lực (trang /cong-nghe).',
    filters: [{ key: 'group', label: 'Nhóm', options: optionsOf(TechnologyGroupLabels) }],
    extraColumns: [{ id: 'group', header: 'Nhóm', cell: (r) => r.extra ? <Badge>{TechnologyGroupLabels[r.extra as TechnologyGroup] ?? String(r.extra)}</Badge> : '—' }],
    fields: [
      ...base,
      { name: 'group', label: 'Nhóm', type: 'select', options: optionsOf(TechnologyGroupLabels) },
      { name: 'websiteUrl', label: 'Website', type: 'url' },
      { name: 'logoMediaId', label: 'Logo', type: 'media', folder: 'Công nghệ' },
      order,
      { name: 'showOnTechPage', label: 'Hiển thị trên trang Công nghệ', type: 'checkbox' },
    ],
  }),
  clients: taxonomy({
    resource: 'clients', permission: 'project', title: 'Khách hàng', label: 'khách hàng',
    description: 'Tên/logo khách hàng chỉ hiển thị trên dự án khi được phép công bố.',
    fields: [
      ...base,
      { name: 'industryId', label: 'Ngành', type: 'lookup', source: 'industries' },
      { name: 'websiteUrl', label: 'Website', type: 'url' },
      { name: 'logoMediaId', label: 'Logo', type: 'media', folder: 'Khách hàng' },
      order,
    ],
  }),
  'project-categories': taxonomy({
    resource: 'project-categories', permission: 'project', title: 'Danh mục dự án', label: 'danh mục', fields: [...base, order, seo],
  }),
  'product-categories': taxonomy({
    resource: 'product-categories', permission: 'product', title: 'Danh mục sản phẩm', label: 'danh mục', fields: [...base, order, seo],
  }),
  'service-categories': taxonomy({
    resource: 'service-categories', permission: 'service', title: 'Nhóm dịch vụ', label: 'nhóm dịch vụ', fields: [...base, order, seo],
  }),
  'post-categories': taxonomy({
    resource: 'post-categories', permission: 'blog', title: 'Danh mục blog', label: 'danh mục',
    description: 'Danh mục và bài viết dùng chung đường dẫn /blog/{slug} nên slug không được trùng nhau.',
    fields: [...base, { name: 'parentId', label: 'Danh mục cha', type: 'lookup', source: 'postCategories', excludeSelf: true }, order, seo],
  }),
  tags: taxonomy({ resource: 'tags', permission: 'blog', title: 'Tag', label: 'tag', fields: [base[0]!, base[1]!] }),
  authors: taxonomy({
    resource: 'authors', permission: 'blog', title: 'Tác giả', label: 'tác giả',
    fields: [
      ...base,
      { name: 'title', label: 'Chức danh', type: 'text' },
      { name: 'avatarMediaId', label: 'Ảnh đại diện', type: 'media', folder: 'Blog/Tác giả' },
      { name: 'links', label: 'Liên kết (LinkedIn, GitHub…)', type: 'links' },
      order,
    ],
  }),
};

// ----- Thu vien noi dung -----

export const libraryConfigs = {
  testimonials: {
    resource: 'testimonials', permission: 'library', title: 'Đánh giá khách hàng', label: 'đánh giá', titleField: 'authorName',
    description: 'Chỉ xuất bản đánh giá có thật, được khách hàng đồng ý công bố.', defaultSort: 'sortOrder',
    empty: { authorName: '', authorTitle: null, company: null, avatarMediaId: null, quote: '', rating: null, projectId: null, productId: null, sortOrder: 0 },
    fields: [
      { name: 'authorName', label: 'Người đánh giá', type: 'text', required: true },
      { name: 'authorTitle', label: 'Chức danh', type: 'text' },
      { name: 'company', label: 'Công ty', type: 'text' },
      { name: 'rating', label: 'Điểm (1–5, tuỳ chọn)', type: 'number' },
      { name: 'quote', label: 'Nội dung', type: 'textarea' },
      { name: 'avatarMediaId', label: 'Ảnh', type: 'media', folder: 'Thư viện/Đánh giá' },
      { name: 'projectId', label: 'Dự án liên quan', type: 'lookup', source: 'projects' },
      { name: 'productId', label: 'Sản phẩm liên quan', type: 'lookup', source: 'products' },
      order,
    ],
  } satisfies DialogCrudConfig<Record<string, unknown>>,
  partners: {
    resource: 'partners', permission: 'library', title: 'Đối tác', label: 'đối tác', titleField: 'name', defaultSort: 'sortOrder',
    empty: { name: '', logoMediaId: null, url: null, kind: null, sortOrder: 0 },
    fields: [
      { name: 'name', label: 'Tên', type: 'text', required: true },
      { name: 'kind', label: 'Loại (vd: Công nghệ, Khách hàng)', type: 'text' },
      { name: 'url', label: 'Website', type: 'url' },
      { name: 'logoMediaId', label: 'Logo', type: 'media', folder: 'Thư viện/Đối tác' },
      order,
    ],
  } satisfies DialogCrudConfig<Record<string, unknown>>,
  'team-members': {
    resource: 'team-members', permission: 'library', title: 'Đội ngũ', label: 'thành viên', titleField: 'fullName', defaultSort: 'sortOrder',
    empty: { fullName: '', title: null, photoMediaId: null, bio: null, links: [], sortOrder: 0 },
    fields: [
      { name: 'fullName', label: 'Họ tên', type: 'text', required: true },
      { name: 'title', label: 'Chức danh', type: 'text' },
      { name: 'bio', label: 'Giới thiệu', type: 'textarea' },
      { name: 'photoMediaId', label: 'Ảnh', type: 'media', folder: 'Thư viện/Đội ngũ' },
      { name: 'links', label: 'Liên kết', type: 'links' },
      order,
    ],
  } satisfies DialogCrudConfig<Record<string, unknown>>,
  faqs: {
    resource: 'faqs', permission: 'library', title: 'Câu hỏi thường gặp', label: 'câu hỏi', titleField: 'question', defaultSort: 'sortOrder',
    description: 'FAQ chung hoặc gắn với dịch vụ/giải pháp/sản phẩm cụ thể.',
    filters: [{ key: 'scope', label: 'Phạm vi', options: optionsOf(FaqScopeLabels) }],
    extraColumns: [{ id: 'scope', header: 'Phạm vi', cell: (r) => <Badge>{FaqScopeLabels[(r.subtitle as FaqScope) ?? 'GLOBAL'] ?? String(r.subtitle)}</Badge> }],
    subtitle: () => null,
    empty: { question: '', answer: '', scope: 'GLOBAL', scopeId: null, sortOrder: 0 },
    fields: [
      { name: 'question', label: 'Câu hỏi', type: 'text', required: true, wide: true },
      { name: 'answer', label: 'Trả lời', type: 'textarea' },
      { name: 'scope', label: 'Phạm vi', type: 'select', options: optionsOf(FaqScopeLabels) },
      {
        name: 'scopeId', label: 'Áp dụng cho', type: 'lookup', source: 'services',
        dependsOn: { field: 'scope', sources: { SERVICE: 'services', PRODUCT: 'products', SOLUTION: 'solutionPages' } },
      },
      order,
    ],
  } satisfies DialogCrudConfig<Record<string, unknown>>,
};
