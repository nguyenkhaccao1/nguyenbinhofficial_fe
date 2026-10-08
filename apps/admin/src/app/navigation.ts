import {
  Boxes, BriefcaseBusiness, Building2, Cpu, FileText, FolderKanban, FolderTree, History, Image, LayoutDashboard,
  Layers, Menu, MessageSquareQuote, Package, PanelsTopLeft, Settings, ShieldCheck, Tags, UserRound, Users,
  UsersRound, CircleHelp, Handshake, Inbox, type LucideIcon,
} from 'lucide-react';
import { Permissions } from '@nb/shared';

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  permission: string;
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

/**
 * Menu theo muc 20 cua yeu cau. Chi liet ke man hinh da hoan thanh (API + UI);
 * Marketing (lead, bao gia, demo) va SEO duoc them khi xong Phase 4–5.
 */
export const navigation: NavGroup[] = [
  { items: [{ label: 'Dashboard', to: '/', icon: LayoutDashboard, permission: Permissions.dashboard.view }] },
  {
    label: 'Khách hàng',
    items: [{ label: 'Yêu cầu khách hàng', to: '/leads', icon: Inbox, permission: Permissions.lead.view }],
  },
  {
    label: 'Nội dung',
    items: [
      { label: 'Trang & Landing', to: '/content/pages', icon: PanelsTopLeft, permission: Permissions.page.view },
      { label: 'Menu & Footer', to: '/content/menus', icon: Menu, permission: Permissions.menu.view },
    ],
  },
  {
    label: 'Sản phẩm',
    items: [
      { label: 'Sản phẩm', to: '/products', icon: Package, permission: Permissions.product.view },
      { label: 'Danh mục sản phẩm', to: '/products/categories', icon: FolderTree, permission: Permissions.product.view },
    ],
  },
  {
    label: 'Dự án',
    items: [
      { label: 'Dự án', to: '/projects', icon: FolderKanban, permission: Permissions.project.view },
      { label: 'Danh mục dự án', to: '/projects/categories', icon: FolderTree, permission: Permissions.project.view },
      { label: 'Ngành', to: '/projects/industries', icon: Building2, permission: Permissions.project.view },
      { label: 'Công nghệ', to: '/projects/technologies', icon: Cpu, permission: Permissions.project.view },
      { label: 'Khách hàng', to: '/projects/clients', icon: BriefcaseBusiness, permission: Permissions.project.view },
    ],
  },
  {
    label: 'Dịch vụ',
    items: [
      { label: 'Dịch vụ', to: '/services', icon: Layers, permission: Permissions.service.view },
      { label: 'Nhóm dịch vụ', to: '/services/categories', icon: Boxes, permission: Permissions.service.view },
    ],
  },
  {
    label: 'Blog',
    items: [
      { label: 'Bài viết', to: '/blog/posts', icon: FileText, permission: Permissions.blog.view },
      { label: 'Danh mục', to: '/blog/categories', icon: FolderTree, permission: Permissions.blog.view },
      { label: 'Tags', to: '/blog/tags', icon: Tags, permission: Permissions.blog.view },
      { label: 'Tác giả', to: '/blog/authors', icon: UserRound, permission: Permissions.blog.view },
    ],
  },
  {
    label: 'Thư viện',
    items: [
      { label: 'Đánh giá', to: '/library/testimonials', icon: MessageSquareQuote, permission: Permissions.library.view },
      { label: 'Đối tác', to: '/library/partners', icon: Handshake, permission: Permissions.library.view },
      { label: 'Đội ngũ', to: '/library/team', icon: UsersRound, permission: Permissions.library.view },
      { label: 'FAQ', to: '/library/faqs', icon: CircleHelp, permission: Permissions.library.view },
    ],
  },
  { label: 'Media', items: [{ label: 'Thư viện media', to: '/media', icon: Image, permission: Permissions.media.view }] },
  { label: 'Website', items: [{ label: 'Cấu hình website', to: '/website/settings', icon: Settings, permission: Permissions.settings.view }] },
  {
    label: 'Hệ thống',
    items: [
      { label: 'Người dùng', to: '/system/users', icon: Users, permission: Permissions.user.view },
      { label: 'Vai trò & quyền', to: '/system/roles', icon: ShieldCheck, permission: Permissions.role.view },
      { label: 'Nhật ký thay đổi', to: '/system/audit-logs', icon: History, permission: Permissions.audit.view },
    ],
  },
];

