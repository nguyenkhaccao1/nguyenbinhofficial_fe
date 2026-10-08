import { index, layout, route, type RouteConfig } from '@react-router/dev/routes';

// Sitemap day du: docs/design/01-sitemap.md (repo backend). Route co dinh truoc, catch-all (Page builder) sau cung.
export default [
  layout('routes/site-layout.tsx', [
    index('routes/home.tsx'),
    route('du-an', 'routes/projects.tsx'),
    route('du-an/:slug', 'routes/project.tsx'),
    route('san-pham', 'routes/products.tsx'),
    route('san-pham/:slug', 'routes/product.tsx'),
    route('dich-vu', 'routes/services.tsx'),
    route('dich-vu/:slug', 'routes/service.tsx'),
    route('giai-phap', 'routes/solutions.tsx'),
    route('cong-nghe', 'routes/technologies.tsx'),
    route('blog', 'routes/blog.tsx'),
    route('blog/:slug', 'routes/blog-slug.tsx'),
    route('search', 'routes/search.tsx'),
    route('lien-he', 'routes/contact.tsx'),
    route('*', 'routes/page.tsx'),
  ]),
] satisfies RouteConfig;
