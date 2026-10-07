import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { hasPermission, useSession, type SessionUser } from '@/auth/session';
import { DataTable } from '@/components/data-table/DataTable';
import { LoginPage } from '@/features/auth/LoginPage';

const user = (roles: string[], permissions: string[]): SessionUser => ({
  id: '1', email: 'a@b.c', fullName: 'A', avatarMediaId: null, roles, permissions,
});

describe('hasPermission', () => {
  it('SuperAdmin has everything', () => {
    expect(hasPermission(user(['SuperAdmin'], []), 'system.purge')).toBe(true);
  });

  it('checks granted permissions for other roles', () => {
    const viewer = user(['Viewer'], ['media.view']);
    expect(hasPermission(viewer, 'media.view')).toBe(true);
    expect(hasPermission(viewer, 'media.delete')).toBe(false);
    expect(hasPermission(null, 'media.view')).toBe(false);
  });
});

function renderLogin() {
  const router = createMemoryRouter([{ path: '/login', element: <LoginPage /> }, { path: '/', element: <p>home</p> }],
    { initialEntries: ['/login'] });
  render(<RouterProvider router={router} />);
  return router;
}

describe('LoginPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    useSession.getState().clear();
  });

  it('validates required fields without calling the API', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    renderLogin();
    await userEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }));

    expect(await screen.findByText('Vui lòng nhập email.')).toBeInTheDocument();
    expect(screen.getByText('Vui lòng nhập mật khẩu.')).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('shows the server message on wrong credentials', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(
      JSON.stringify({ success: false, data: null, message: 'Email hoặc mật khẩu không đúng.', errors: null }),
      { status: 401, headers: { 'content-type': 'application/json' } },
    ));
    renderLogin();
    await userEvent.type(screen.getByLabelText(/Email/), 'admin@test.local');
    await userEvent.type(screen.getByLabelText(/Mật khẩu/), 'wrong-pass-1');
    await userEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Email hoặc mật khẩu không đúng.');
    expect(useSession.getState().status).not.toBe('authenticated');
  });

  it('stores the session and redirects on success', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(
      JSON.stringify({
        success: true, message: null, errors: null,
        data: { accessToken: 'token', expiresAt: '2030-01-01T00:00:00Z', user: user(['Admin'], ['dashboard.view']) },
      }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    ));
    const router = renderLogin();
    await userEvent.type(screen.getByLabelText(/Email/), 'admin@test.local');
    await userEvent.type(screen.getByLabelText(/Mật khẩu/), 'Admin-test-123');
    await userEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }));

    expect(await screen.findByText('home')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/');
    expect(useSession.getState().accessToken).toBe('token');
    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe('/api/v1/admin/auth/login');
    expect(JSON.parse(String(init?.body))).toEqual({ email: 'admin@test.local', password: 'Admin-test-123', rememberMe: false });
  });
});

describe('DataTable', () => {
  const rows = [{ id: 'a', name: 'Alpha' }, { id: 'b', name: 'Beta' }];
  const renderTable = (props: Partial<Parameters<typeof DataTable<{ id: string; name: string }>>[0]> = {}) => {
    const client = new QueryClient();
    return render(
      <QueryClientProvider client={client}>
        <DataTable<{ id: string; name: string }>
          tableId="test"
          columns={[{ id: 'name', header: 'Tên', sortKey: 'name', cell: (r) => r.name }]}
          data={{ items: rows, page: 1, pageSize: 20, totalItems: 2, totalPages: 1 }}
          isLoading={false}
          error={null}
          onRetry={() => {}}
          getRowId={(r) => r.id}
          onPageChange={() => {}}
          onPageSizeChange={() => {}}
          {...props}
        />
      </QueryClientProvider>,
    );
  };

  it('renders rows and toggles sort through the header', async () => {
    const onSortChange = vi.fn();
    renderTable({ sort: 'name', onSortChange });
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Tên/ })).toHaveAttribute('aria-sort', 'ascending');

    await userEvent.click(screen.getByRole('button', { name: /Tên/ }));
    expect(onSortChange).toHaveBeenCalledWith('-name');
  });

  it('shows bulk actions for selected rows', async () => {
    renderTable({ bulkActions: (ids) => <span>bulk:{ids.join(',')}</span> });
    const rowsEl = screen.getAllByRole('row');
    await userEvent.click(within(rowsEl[2]!).getByRole('checkbox'));
    expect(screen.getByText('bulk:b')).toBeInTheDocument();
  });

  it('shows the empty state', () => {
    renderTable({ data: { items: [], page: 1, pageSize: 20, totalItems: 0, totalPages: 0 }, emptyTitle: 'Trống trơn' });
    expect(screen.getByText('Trống trơn')).toBeInTheDocument();
  });
});
