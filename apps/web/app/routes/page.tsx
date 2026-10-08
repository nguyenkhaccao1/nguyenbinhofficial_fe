import { PageRenderer } from '~/components/blocks';
import { cacheHeaders, getPage, orNotFound } from '~/lib/api.server';
import { buildMeta, customSchema } from '~/lib/seo';
import type { Route } from './+types/page';

/** Catch-all: trang Page builder theo duong dan (gioi thieu, landing SEO, giai phap/{nganh}, phap ly…); khong co → 404 that. */
export async function loader({ params }: Route.LoaderArgs) {
  const path = `/${params['*'] ?? ''}`;
  return { page: await orNotFound(getPage(path)) };
}

export const headers = () => cacheHeaders;

export const meta: Route.MetaFunction = ({ loaderData, matches, location }) => {
  const page = loaderData?.page;
  return [
    ...buildMeta({ matches, path: page?.path ?? location.pathname, title: page?.title, seo: page?.seo }),
    ...customSchema(page?.seo),
  ];
};

export default function CmsPage({ loaderData }: Route.ComponentProps) {
  return <PageRenderer page={loaderData.page} />;
}
