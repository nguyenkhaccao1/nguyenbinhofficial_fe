/**
 * Ban sao ma permission cua backend (NguyenBinh.Shared.Authorization.Permissions) — chi de an/hien UI.
 * Backend luon kiem tra lai; them quyen moi phai cap nhat ca hai noi.
 */
export const Permissions = {
  dashboard: { view: 'dashboard.view' },
  page: { view: 'page.view', create: 'page.create', update: 'page.update', delete: 'page.delete', publish: 'page.publish', customHtml: 'page.custom_html' },
  menu: { view: 'menu.view', update: 'menu.update' },
  product: { view: 'product.view', create: 'product.create', update: 'product.update', delete: 'product.delete', publish: 'product.publish' },
  project: { view: 'project.view', create: 'project.create', update: 'project.update', delete: 'project.delete', publish: 'project.publish' },
  service: { view: 'service.view', create: 'service.create', update: 'service.update', delete: 'service.delete', publish: 'service.publish' },
  blog: { view: 'blog.view', create: 'blog.create', update: 'blog.update', delete: 'blog.delete', publish: 'blog.publish' },
  library: { view: 'library.view', create: 'library.create', update: 'library.update', delete: 'library.delete', publish: 'library.publish' },
  media: { view: 'media.view', upload: 'media.upload', update: 'media.update', delete: 'media.delete' },
  lead: { view: 'lead.view', create: 'lead.create', update: 'lead.update', delete: 'lead.delete', assign: 'lead.assign', export: 'lead.export' },
  seo: { view: 'seo.view', update: 'seo.update', redirect: 'seo.redirect', sitemap: 'seo.sitemap' },
  settings: { view: 'settings.view', update: 'settings.update' },
  user: { view: 'user.view', create: 'user.create', update: 'user.update', delete: 'user.delete' },
  role: { view: 'role.view', create: 'role.create', update: 'role.update', delete: 'role.delete' },
  audit: { view: 'audit.view' },
  system: { view: 'system.view', purge: 'system.purge' },
} as const;

/** Nhan tieng Viet cho man phan quyen. */
export const PermissionModuleLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  page: 'Trang & Landing',
  menu: 'Menu / Header / Footer',
  product: 'Sản phẩm',
  project: 'Dự án',
  service: 'Dịch vụ',
  blog: 'Blog',
  library: 'Thư viện (Testimonial, Đối tác, Team, FAQ)',
  media: 'Media',
  lead: 'Lead / CRM',
  seo: 'SEO',
  settings: 'Cấu hình website',
  user: 'Người dùng',
  role: 'Vai trò',
  audit: 'Nhật ký thay đổi',
  system: 'Hệ thống',
};

export const PermissionActionLabels: Record<string, string> = {
  view: 'Xem',
  create: 'Tạo',
  update: 'Sửa',
  delete: 'Xoá',
  publish: 'Xuất bản',
  upload: 'Tải lên',
  assign: 'Phân công',
  export: 'Xuất file',
  redirect: 'Redirect',
  sitemap: 'Sitemap',
  custom_html: 'Custom HTML',
  purge: 'Xoá vĩnh viễn',
};
