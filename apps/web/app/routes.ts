import { index, layout, route, type RouteConfig } from '@react-router/dev/routes';

// Sitemap day du: docs/design/01-sitemap.md. Cac route san pham/du an/dich vu/blog duoc them o Phase 3.
export default [
  layout('routes/site-layout.tsx', [
    index('routes/home.tsx'),
    route('*', 'routes/not-found.tsx'),
  ]),
] satisfies RouteConfig;
