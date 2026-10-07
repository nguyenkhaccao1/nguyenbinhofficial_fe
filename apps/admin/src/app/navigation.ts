import { History, Image, LayoutDashboard, Settings, ShieldCheck, Users, type LucideIcon } from 'lucide-react';
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
 * Menu theo muc 20 cua yeu cau. Chi liet ke man hinh da hoan thanh (API + UI); cac nhom
 * Noi dung / San pham / Du an / Dich vu / Blog / Marketing / SEO duoc them vao khi xong tung phase.
 */
export const navigation: NavGroup[] = [
  {
    items: [{ label: 'Dashboard', to: '/', icon: LayoutDashboard, permission: Permissions.dashboard.view }],
  },
  {
    label: 'Media',
    items: [{ label: 'Thư viện media', to: '/media', icon: Image, permission: Permissions.media.view }],
  },
  {
    label: 'Website',
    items: [{ label: 'Cấu hình website', to: '/website/settings', icon: Settings, permission: Permissions.settings.view }],
  },
  {
    label: 'Hệ thống',
    items: [
      { label: 'Người dùng', to: '/system/users', icon: Users, permission: Permissions.user.view },
      { label: 'Vai trò & quyền', to: '/system/roles', icon: ShieldCheck, permission: Permissions.role.view },
      { label: 'Nhật ký thay đổi', to: '/system/audit-logs', icon: History, permission: Permissions.audit.view },
    ],
  },
];
