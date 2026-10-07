import { FileQuestion } from 'lucide-react';
import type { ReactNode } from 'react';
import { createBrowserRouter, Link } from 'react-router';
import { Permissions } from '@nb/shared';
import { AppShell } from '@/app/AppShell';
import { RequireAuth, RequirePermission } from '@/auth/guards';
import { DialogCrudPage, type DialogCrudConfig } from '@/components/content/DialogCrudPage';
import { EmptyState } from '@/components/ui/Feedback';
import { LoginPage } from '@/features/auth/LoginPage';
import { ProfilePage } from '@/features/auth/ProfilePage';
import { PostEditorPage, PostsPage } from '@/features/blog/PostPages';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { MediaLibraryPage } from '@/features/media/MediaLibraryPage';
import { MenusPage } from '@/features/menus/MenusPage';
import { PageEditorPage, PagesPage } from '@/features/pages/PagePages';
import { ProductEditorPage, ProductsPage } from '@/features/products/ProductPages';
import { ProjectEditorPage } from '@/features/projects/ProjectEditorPage';
import { ProjectsPage } from '@/features/projects/ProjectsPage';
import { ServiceEditorPage, ServicesPage } from '@/features/services/ServicePages';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { AuditLogsPage } from '@/features/system/AuditLogsPage';
import { RolesPage } from '@/features/system/RolesPage';
import { UsersPage } from '@/features/system/UsersPage';
import { libraryConfigs, taxonomyConfigs } from '@/features/taxonomies/configs';

const guard = (permission: string, element: ReactNode) => (
  <RequirePermission permission={permission}>{element}</RequirePermission>
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const crud = (config: DialogCrudConfig<any>) => (
  guard(`${config.permission}.view`, <DialogCrudPage key={config.resource} config={config} />)
);

export const router = createBrowserRouter(
  [
    { path: '/login', element: <LoginPage /> },
    {
      path: '/',
      element: <RequireAuth><AppShell /></RequireAuth>,
      children: [
        { index: true, element: guard(Permissions.dashboard.view, <DashboardPage />) },

        { path: 'content/pages', element: guard(Permissions.page.view, <PagesPage />) },
        { path: 'content/pages/:id', element: guard(Permissions.page.view, <PageEditorPage />) },
        { path: 'content/menus', element: guard(Permissions.menu.view, <MenusPage />) },

        { path: 'products', element: guard(Permissions.product.view, <ProductsPage />) },
        { path: 'products/categories', element: crud(taxonomyConfigs['product-categories']) },
        { path: 'products/:id', element: guard(Permissions.product.view, <ProductEditorPage />) },

        { path: 'projects', element: guard(Permissions.project.view, <ProjectsPage />) },
        { path: 'projects/categories', element: crud(taxonomyConfigs['project-categories']) },
        { path: 'projects/industries', element: crud(taxonomyConfigs.industries) },
        { path: 'projects/technologies', element: crud(taxonomyConfigs.technologies) },
        { path: 'projects/clients', element: crud(taxonomyConfigs.clients) },
        { path: 'projects/:id', element: guard(Permissions.project.view, <ProjectEditorPage />) },

        { path: 'services', element: guard(Permissions.service.view, <ServicesPage />) },
        { path: 'services/categories', element: crud(taxonomyConfigs['service-categories']) },
        { path: 'services/:id', element: guard(Permissions.service.view, <ServiceEditorPage />) },

        { path: 'blog/posts', element: guard(Permissions.blog.view, <PostsPage />) },
        { path: 'blog/posts/:id', element: guard(Permissions.blog.view, <PostEditorPage />) },
        { path: 'blog/categories', element: crud(taxonomyConfigs['post-categories']) },
        { path: 'blog/tags', element: crud(taxonomyConfigs.tags) },
        { path: 'blog/authors', element: crud(taxonomyConfigs.authors) },

        { path: 'library/testimonials', element: crud(libraryConfigs.testimonials) },
        { path: 'library/partners', element: crud(libraryConfigs.partners) },
        { path: 'library/team', element: crud(libraryConfigs['team-members']) },
        { path: 'library/faqs', element: crud(libraryConfigs.faqs) },

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
