import { FileQuestion } from 'lucide-react';
import { createBrowserRouter, Link } from 'react-router';
import { Permissions } from '@nb/shared';
import { AppShell } from '@/app/AppShell';
import { RequireAuth, RequirePermission } from '@/auth/guards';
import { EmptyState } from '@/components/ui/Feedback';
import { LoginPage } from '@/features/auth/LoginPage';
import { ProfilePage } from '@/features/auth/ProfilePage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { MediaLibraryPage } from '@/features/media/MediaLibraryPage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { AuditLogsPage } from '@/features/system/AuditLogsPage';
import { RolesPage } from '@/features/system/RolesPage';
import { UsersPage } from '@/features/system/UsersPage';

const guard = (permission: string, element: React.ReactNode) => (
  <RequirePermission permission={permission}>{element}</RequirePermission>
);

export const router = createBrowserRouter(
  [
    { path: '/login', element: <LoginPage /> },
    {
      path: '/',
      element: <RequireAuth><AppShell /></RequireAuth>,
      children: [
        { index: true, element: guard(Permissions.dashboard.view, <DashboardPage />) },
        { path: 'media', element: guard(Permissions.media.view, <MediaLibraryPage />) },
        { path: 'website/settings', element: guard(Permissions.settings.view, <SettingsPage />) },
        { path: 'system/users', element: guard(Permissions.user.view, <UsersPage />) },
        { path: 'system/roles', element: guard(Permissions.role.view, <RolesPage />) },
        { path: 'system/audit-logs', element: guard(Permissions.audit.view, <AuditLogsPage />) },
        { path: 'profile', element: <ProfilePage /> },
        {
          path: '*',
          element: (
            <EmptyState icon={<FileQuestion />} title="Không tìm thấy trang"
              action={<Link to="/" className="text-primary hover:underline">Về Dashboard</Link>} />
          ),
        },
      ],
    },
  ],
  { basename: '/admin' },
);
