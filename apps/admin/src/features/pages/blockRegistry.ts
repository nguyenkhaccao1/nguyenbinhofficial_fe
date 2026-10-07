import type { Lookups } from '@nb/shared';

/**
 * Dinh nghia form cho tung loai block (khop BlockTypes o backend). Them block moi: khai bao o day,
 * them renderer o web; backend chi can ten loai trong BlockTypes.
 */
export type BlockField =
  | { name: string; label: string; type: 'text' | 'textarea' | 'url' | 'number' | 'code'; hint?: string; placeholder?: string }
  | { name: string; label: string; type: 'richtext' }
  | { name: string; label: string; type: 'boolean' }
  | { name: string; label: string; type: 'select'; options: { value: string; label: string }[] }
  | { name: string; label: string; type: 'media' | 'mediaList'; kind?: 'IMAGE' | 'VIDEO' | 'ANY' }
  | { name: string; label: string; type: 'cta' }
  | { name: string; label: string; type: 'stringList'; placeholder?: string }
  | { name: string; label: string; type: 'lookup' | 'lookupMulti'; source: keyof Lookups; showWhen?: { field: string; values: string[] } }
  | { name: string; label: string; type: 'items'; itemLabel: string; fields: BlockField[]; max?: number };

export interface BlockDefinition {
  type: string;
  label: string;
  category: 'Bố cục' | 'Văn bản' | 'Media' | 'Nội dung' | 'Dữ liệu động' | 'Form' | 'Nâng cao';
  description: string;
  fields: BlockField[];
  defaults: Record<string, unknown>;
  /** Tom tat hien tren canvas. */
  summary?: (data: Record<string, unknown>) => string | undefined;
}

const title: BlockField = { name: 'title', label: 'Tiêu đề', type: 'text' };
const subtitle: BlockField = { name: 'subtitle', label: 'Mô tả', type: 'textarea' };
const limit: BlockField = { name: 'limit', label: 'Số lượng tối đa', type: 'number' };
const cta: BlockField = { name: 'cta', label: 'Nút xem thêm', type: 'cta' };
const eyebrow: BlockField = { name: 'eyebrow', label: 'Dòng nhỏ phía trên', type: 'text' };

const opts = (o: Record<string, string>) => Object.entries(o).map(([value, label]) => ({ value, label }));

export const blockRegistry: BlockDefinition[] = [
  {
    type: 'HERO', label: 'Hero', category: 'Bố cục', description: 'Tiêu đề lớn, mô tả, nút hành động, hình giao diện sản phẩm.',
    defaults: { title: '', subtitle: '', primaryCta: { label: '', url: '' }, secondaryCta: { label: '', url: '' }, visual: { source: 'featuredProjectScreenshots', limit: 4 } },
    fields: [
      eyebrow,
      { name: 'title', label: 'Tiêu đề', type: 'textarea' },
      { name: 'subtitle', label: 'Mô tả', type: 'textarea' },
      { name: 'primaryCta', label: 'Nút chính', type: 'cta' },
      { name: 'secondaryCta', label: 'Nút phụ', type: 'cta' },
      { name: 'visual.source', label: 'Hình minh hoạ', type: 'select', options: opts({ featuredProjectScreenshots: 'Ảnh màn hình dự án nổi bật', custom: 'Tự chọn ảnh', none: 'Không có' }) },
      { name: 'visual.mediaIds', label: 'Ảnh tự chọn', type: 'mediaList' },
    ],
  },
  {
    type: 'HEADING', label: 'Tiêu đề', category: 'Văn bản', description: 'Tiêu đề section + mô tả ngắn.',
    defaults: { title: '', subtitle: '', level: 'h2' },
    fields: [eyebrow, title, subtitle, { name: 'level', label: 'Cấp tiêu đề', type: 'select', options: opts({ h2: 'H2', h3: 'H3' }) }],
  },
  {
    type: 'TEXT', label: 'Đoạn văn', category: 'Văn bản', description: 'Văn bản thường.',
    defaults: { text: '' }, fields: [{ name: 'text', label: 'Nội dung', type: 'textarea' }],
    summary: (d) => String(d.text ?? '').slice(0, 80),
  },
  {
    type: 'RICH_TEXT', label: 'Rich text', category: 'Văn bản', description: 'Văn bản định dạng (đậm, danh sách, liên kết, ảnh).',
    defaults: { html: '' }, fields: [{ name: 'html', label: 'Nội dung', type: 'richtext' }],
    summary: (d) => String(d.html ?? '').replace(/<[^>]+>/g, ' ').trim().slice(0, 80),
  },
  {
    type: 'IMAGE', label: 'Hình ảnh', category: 'Media', description: 'Một ảnh, có thể đặt trong khung trình duyệt/điện thoại.',
    defaults: { mediaId: null, caption: '', frame: 'none', link: '' },
    fields: [
      { name: 'mediaId', label: 'Ảnh', type: 'media' },
      { name: 'caption', label: 'Chú thích', type: 'text' },
      { name: 'frame', label: 'Khung', type: 'select', options: opts({ none: 'Không khung', browser: 'Trình duyệt', phone: 'Điện thoại', tablet: 'Máy tính bảng' }) },
      { name: 'link', label: 'Liên kết (tuỳ chọn)', type: 'url' },
    ],
  },
  {
    type: 'VIDEO', label: 'Video', category: 'Media', description: 'YouTube/Vimeo (chỉ tải khi người xem bấm) hoặc file video.',
    defaults: { url: '', mediaId: null, posterMediaId: null, caption: '' },
    fields: [
      { name: 'url', label: 'Link YouTube/Vimeo', type: 'url' },
      { name: 'mediaId', label: 'Hoặc file video', type: 'media', kind: 'VIDEO' },
      { name: 'posterMediaId', label: 'Ảnh poster', type: 'media' },
      { name: 'caption', label: 'Chú thích', type: 'text' },
    ],
  },
  {
    type: 'GALLERY', label: 'Thư viện ảnh', category: 'Media', description: 'Lưới ảnh (không dùng carousel tự chạy).',
    defaults: { mediaIds: [], columns: '3' },
    fields: [{ name: 'mediaIds', label: 'Ảnh', type: 'mediaList' }, { name: 'columns', label: 'Số cột', type: 'select', options: opts({ 2: '2', 3: '3', 4: '4' }) }],
    summary: (d) => `${(d.mediaIds as unknown[] | undefined)?.length ?? 0} ảnh`,
  },
  {
    type: 'STATS', label: 'Số liệu', category: 'Nội dung', description: 'Chỉ dùng số liệu có thật.',
    defaults: { items: [] },
    fields: [title, { name: 'items', label: 'Số liệu', type: 'items', itemLabel: 'số liệu', max: 8, fields: [
      { name: 'value', label: 'Giá trị', type: 'text' }, { name: 'label', label: 'Nhãn', type: 'text' }, { name: 'description', label: 'Ghi chú', type: 'text' },
    ] }],
  },
  {
    type: 'LOGO_CLOUD', label: 'Logo', category: 'Nội dung', description: 'Logo công nghệ, đối tác hoặc khách hàng (được phép công bố).',
    defaults: { title: '', source: 'technologies', mediaIds: [] },
    fields: [title, { name: 'source', label: 'Nguồn', type: 'select', options: opts({ technologies: 'Công nghệ', partners: 'Đối tác', clients: 'Khách hàng (được phép)', custom: 'Tự chọn' }) },
      { name: 'mediaIds', label: 'Logo tự chọn', type: 'mediaList' }],
  },
  {
    type: 'FEATURE_GRID', label: 'Lưới tính năng', category: 'Nội dung', description: 'Các ô tính năng/lợi ích.',
    defaults: { title: '', subtitle: '', columns: '3', items: [] },
    fields: [eyebrow, title, subtitle, { name: 'columns', label: 'Số cột', type: 'select', options: opts({ 2: '2', 3: '3', 4: '4' }) },
      { name: 'items', label: 'Ô', type: 'items', itemLabel: 'ô', max: 24, fields: [
        { name: 'icon', label: 'Icon (lucide)', type: 'text' }, { name: 'title', label: 'Tiêu đề', type: 'text' },
        { name: 'description', label: 'Mô tả', type: 'textarea' }, { name: 'link', label: 'Liên kết', type: 'url' }, { name: 'mediaId', label: 'Ảnh', type: 'media' },
      ] }],
  },
  {
    type: 'PROJECTS', label: 'Dự án', category: 'Dữ liệu động', description: 'Lấy dự án đã xuất bản từ CMS.',
    defaults: { title: '', source: 'featured', limit: 6, layout: 'grid' },
    fields: [eyebrow, title, subtitle,
      { name: 'source', label: 'Nguồn', type: 'select', options: opts({ featured: 'Dự án nổi bật', latest: 'Mới nhất', industry: 'Theo ngành', highlight: 'Case study nổi bật (1 dự án)', manual: 'Tự chọn' }) },
      { name: 'industryId', label: 'Ngành', type: 'lookup', source: 'industries', showWhen: { field: 'source', values: ['industry'] } },
      { name: 'projectIds', label: 'Chọn dự án', type: 'lookupMulti', source: 'projects', showWhen: { field: 'source', values: ['manual', 'highlight'] } },
      limit, { name: 'layout', label: 'Bố cục', type: 'select', options: opts({ grid: 'Lưới card', highlight: 'Case study lớn', list: 'Danh sách' }) }, cta],
  },
  {
    type: 'PRODUCTS', label: 'Sản phẩm', category: 'Dữ liệu động', description: 'Sản phẩm của Nguyên Bình đã xuất bản.',
    defaults: { title: '', source: 'featured', limit: 3 },
    fields: [eyebrow, title, subtitle, { name: 'source', label: 'Nguồn', type: 'select', options: opts({ featured: 'Nổi bật', all: 'Tất cả', manual: 'Tự chọn' }) },
      { name: 'productIds', label: 'Chọn sản phẩm', type: 'lookupMulti', source: 'products', showWhen: { field: 'source', values: ['manual'] } }, limit, cta],
  },
  {
    type: 'SERVICES', label: 'Dịch vụ', category: 'Dữ liệu động', description: 'Dịch vụ đã xuất bản.',
    defaults: { title: '', source: 'featured', limit: 10 },
    fields: [eyebrow, title, subtitle, { name: 'source', label: 'Nguồn', type: 'select', options: opts({ featured: 'Nổi bật', all: 'Tất cả', category: 'Theo nhóm', manual: 'Tự chọn' }) },
      { name: 'categoryId', label: 'Nhóm', type: 'lookup', source: 'serviceCategories', showWhen: { field: 'source', values: ['category'] } },
      { name: 'serviceIds', label: 'Chọn dịch vụ', type: 'lookupMulti', source: 'services', showWhen: { field: 'source', values: ['manual'] } }, limit, cta],
  },
  {
    type: 'INDUSTRIES', label: 'Ngành / giải pháp', category: 'Dữ liệu động', description: 'Ô ngành liên kết tới /giai-phap/{ngành}.',
    defaults: { title: '', source: 'all' },
    fields: [eyebrow, title, subtitle, { name: 'source', label: 'Nguồn', type: 'select', options: opts({ all: 'Tất cả ngành', manual: 'Tự chọn' }) },
      { name: 'industryIds', label: 'Chọn ngành', type: 'lookupMulti', source: 'industries', showWhen: { field: 'source', values: ['manual'] } }],
  },
  {
    type: 'TECH_STACK', label: 'Công nghệ', category: 'Dữ liệu động', description: 'Công nghệ có năng lực, nhóm theo Backend/Frontend/Mobile…',
    defaults: { title: '', source: 'all', layout: 'grouped', capabilities: [] },
    fields: [title, { name: 'capabilities', label: 'Năng lực (dải chữ)', type: 'stringList', placeholder: 'vd: POS' },
      { name: 'layout', label: 'Bố cục', type: 'select', options: opts({ grouped: 'Theo nhóm', strip: 'Dải logo' }) }],
  },
  {
    type: 'TESTIMONIALS', label: 'Đánh giá', category: 'Dữ liệu động', description: 'Đánh giá khách hàng đã xuất bản. Ẩn nếu không có.',
    defaults: { title: '', source: 'all', limit: 6 },
    fields: [title, { name: 'source', label: 'Nguồn', type: 'select', options: opts({ all: 'Tất cả', product: 'Theo sản phẩm' }) },
      { name: 'productId', label: 'Sản phẩm', type: 'lookup', source: 'products', showWhen: { field: 'source', values: ['product'] } }, limit],
  },
  {
    type: 'TEAM', label: 'Đội ngũ', category: 'Dữ liệu động', description: 'Thành viên đã xuất bản.',
    defaults: { title: '', limit: 12 }, fields: [eyebrow, title, subtitle, limit],
  },
  {
    type: 'TIMELINE', label: 'Quy trình / Timeline', category: 'Nội dung', description: 'Các bước, mỗi bước nêu rõ đầu ra.',
    defaults: { title: '', items: [] },
    fields: [eyebrow, title, subtitle, { name: 'items', label: 'Bước', type: 'items', itemLabel: 'bước', max: 12, fields: [
      { name: 'title', label: 'Tên bước', type: 'text' }, { name: 'description', label: 'Làm gì', type: 'textarea' }, { name: 'output', label: 'Đầu ra', type: 'textarea' },
    ] }],
  },
  {
    type: 'FAQ', label: 'Câu hỏi thường gặp', category: 'Nội dung', description: 'Tự nhập hoặc lấy từ thư viện FAQ.',
    defaults: { title: 'Câu hỏi thường gặp', source: 'manual', items: [] },
    fields: [title, { name: 'source', label: 'Nguồn', type: 'select', options: opts({ manual: 'Tự nhập', global: 'FAQ chung trong thư viện' }) },
      { name: 'items', label: 'Câu hỏi', type: 'items', itemLabel: 'câu hỏi', max: 30, fields: [
        { name: 'question', label: 'Câu hỏi', type: 'text' }, { name: 'answer', label: 'Trả lời', type: 'textarea' },
      ] }],
  },
  {
    type: 'CTA', label: 'Kêu gọi hành động', category: 'Bố cục', description: 'Khối CTA cuối trang.',
    defaults: { title: '', subtitle: '', primaryCta: { label: '', url: '' } },
    fields: [title, subtitle, { name: 'primaryCta', label: 'Nút chính', type: 'cta' }, { name: 'secondaryCta', label: 'Nút phụ', type: 'cta' },
      { name: 'tertiaryCta', label: 'Nút thứ ba', type: 'cta' }],
  },
  {
    type: 'CONTACT_FORM', label: 'Form liên hệ', category: 'Form', description: 'Form thu lead (liên hệ / báo giá / demo).',
    defaults: { title: '', formType: 'contact' },
    fields: [title, subtitle, { name: 'formType', label: 'Loại form', type: 'select', options: opts({ contact: 'Liên hệ', quote: 'Yêu cầu báo giá', demo: 'Yêu cầu demo' }) },
      { name: 'productId', label: 'Sản phẩm (form demo)', type: 'lookup', source: 'products', showWhen: { field: 'formType', values: ['demo'] } }],
  },
  {
    type: 'PRICING', label: 'Bảng giá', category: 'Nội dung', description: 'Lấy bảng giá của một sản phẩm.',
    defaults: { title: 'Bảng giá', productId: null }, fields: [title, subtitle, { name: 'productId', label: 'Sản phẩm', type: 'lookup', source: 'products' }],
  },
  {
    type: 'COMPARISON', label: 'So sánh', category: 'Nội dung', description: 'Bảng so sánh (vd: tự xây vs. dùng sản phẩm).',
    defaults: { title: '', columns: [], rows: [] },
    fields: [title, { name: 'columns', label: 'Tiêu đề cột', type: 'stringList', placeholder: 'Tên cột' },
      { name: 'rows', label: 'Dòng', type: 'items', itemLabel: 'dòng', max: 30, fields: [
        { name: 'label', label: 'Tiêu chí', type: 'text' }, { name: 'values', label: 'Giá trị theo cột', type: 'stringList' },
      ] }],
  },
  {
    type: 'BLOG', label: 'Bài viết', category: 'Dữ liệu động', description: 'Bài viết blog đã xuất bản.',
    defaults: { title: '', source: 'latest', limit: 3 },
    fields: [title, { name: 'source', label: 'Nguồn', type: 'select', options: opts({ latest: 'Mới nhất', featured: 'Nổi bật', category: 'Theo danh mục' }) },
      { name: 'categoryId', label: 'Danh mục', type: 'lookup', source: 'postCategories', showWhen: { field: 'source', values: ['category'] } }, limit, cta],
  },
  {
    type: 'CUSTOM_HTML', label: 'HTML tuỳ chỉnh', category: 'Nâng cao', description: 'Chỉ người có quyền “Custom HTML” thêm/sửa được.',
    defaults: { html: '' }, fields: [{ name: 'html', label: 'HTML', type: 'code' }],
  },
  {
    type: 'SPACER', label: 'Khoảng trắng', category: 'Bố cục', description: 'Khoảng cách dọc.',
    defaults: { size: 'md' }, fields: [{ name: 'size', label: 'Kích thước', type: 'select', options: opts({ sm: 'Nhỏ', md: 'Vừa', lg: 'Lớn', xl: 'Rất lớn' }) }],
  },
  {
    type: 'DIVIDER', label: 'Đường kẻ', category: 'Bố cục', description: 'Đường phân cách.',
    defaults: { style: 'line' }, fields: [{ name: 'style', label: 'Kiểu', type: 'select', options: opts({ line: 'Liền', dashed: 'Nét đứt' }) }],
  },
];

export const blockByType = new Map(blockRegistry.map((b) => [b.type, b]));

export function blockSummary(type: string, data: Record<string, unknown> | null | undefined): string {
  const def = blockByType.get(type);
  const d = data ?? {};
  const custom = def?.summary?.(d);
  if (custom) return custom;
  const text = [d.title, d.text, d.caption].find((v) => typeof v === 'string' && v.trim()) as string | undefined;
  return text?.slice(0, 90) ?? '';
}

/** Cai dat section (luu SettingsJson). */
export const sectionSettingFields: BlockField[] = [
  { name: 'tone', label: 'Nền', type: 'select', options: opts({ light: 'Sáng', subtle: 'Xám nhạt', dark: 'Tối' }) },
  { name: 'width', label: 'Độ rộng', type: 'select', options: opts({ content: 'Nội dung (1280px)', wide: 'Rộng (1440px)', full: 'Tràn màn hình' }) },
  { name: 'padding', label: 'Khoảng đệm dọc', type: 'select', options: opts({ none: 'Không', sm: 'Nhỏ', md: 'Vừa', lg: 'Lớn' }) },
  { name: 'align', label: 'Căn chỉnh', type: 'select', options: opts({ left: 'Trái', center: 'Giữa' }) },
  { name: 'animation', label: 'Hiệu ứng xuất hiện', type: 'select', options: opts({ none: 'Không', 'fade-up': 'Hiện dần từ dưới' }) },
  { name: 'anchorId', label: 'Anchor ID (link #)', type: 'text', placeholder: 'vd: quy-trinh' },
  { name: 'hideOnMobile', label: 'Ẩn trên mobile', type: 'boolean' },
  { name: 'hideOnDesktop', label: 'Ẩn trên desktop', type: 'boolean' },
  { name: 'customClass', label: 'CSS class tuỳ chỉnh', type: 'text' },
];

export const blockSettingFields: BlockField[] = [
  { name: 'animation', label: 'Hiệu ứng xuất hiện', type: 'select', options: opts({ none: 'Không', 'fade-up': 'Hiện dần từ dưới' }) },
  { name: 'hideOnMobile', label: 'Ẩn trên mobile', type: 'boolean' },
  { name: 'customClass', label: 'CSS class tuỳ chỉnh', type: 'text' },
];
