import { data } from 'react-router';

/** Catch-all: tra status 404 that (khong soft-404) → root ErrorBoundary hien trang 404. */
export function loader() {
  throw data(null, { status: 404 });
}

export const meta = () => [{ title: 'Không tìm thấy trang' }, { name: 'robots', content: 'noindex' }];

export default function NotFound() {
  return null;
}
