import { ChevronDown, LogOut, Menu, UserRound, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { hasPermission, useSession } from '@/auth/session';
import { IconButton } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { logout } from '@/lib/http';
import { navigation } from './navigation';

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setMobileOpen(false), [location.pathname]);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2">
        Bỏ qua điều hướng
      </a>

      {/* Sidebar: co dinh tren desktop, drawer tren mobile */}
      <div
        className={cn('fixed inset-0 z-30 bg-dark/40 lg:hidden', mobileOpen ? 'block' : 'hidden')}
        onClick={() => setMobileOpen(false)}
        aria-hidden
      />
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-[260px] border-r border-border bg-white transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-border px-5">
          <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="grid size-7 place-items-center rounded-md bg-dark text-xs font-bold text-white">NB</span>
            Nguyên Bình
          </Link>
          <IconButton label="Đóng menu" className="lg:hidden" icon={<X className="size-4" />} onClick={() => setMobileOpen(false)} />
        </div>
        <Sidebar />
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-white/95 px-4 backdrop-blur lg:px-8">
          <IconButton label="Mở menu" className="lg:hidden" icon={<Menu className="size-5" />} onClick={() => setMobileOpen(true)} />
          <div className="flex-1" />
          <UserMenu />
        </header>
        <main id="main" className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function Sidebar() {
  const user = useSession((s) => s.user);
  return (
    <nav aria-label="Điều hướng chính" className="h-[calc(100vh-3.5rem)] overflow-y-auto px-3 py-4">
      {navigation.map((group, i) => {
        const items = group.items.filter((item) => hasPermission(user, item.permission));
        if (items.length === 0) return null;
        return (
          <div key={group.label ?? i} className="mb-5">
            {group.label && (
              <p className="mb-1.5 px-3 text-[11px] font-semibold tracking-wider text-fg-muted uppercase">{group.label}</p>
            )}
            <ul className="space-y-0.5">
              {items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) => cn(
                      'flex items-center gap-2.5 rounded-md px-3 py-2 font-medium transition-colors',
                      isActive ? 'bg-primary-soft text-primary' : 'text-fg/80 hover:bg-bg-subtle hover:text-fg',
                    )}
                  >
                    <item.icon className="size-4" aria-hidden />
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

function UserMenu() {
  const user = useSession((s) => s.user);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button type="button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-bg-subtle">
        <span className="grid size-8 place-items-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
          {user?.fullName.split(' ').map((w) => w[0]).slice(-2).join('').toUpperCase()}
        </span>
        <span className="hidden text-left sm:block">
          <span className="block text-[13px] leading-4 font-medium">{user?.fullName}</span>
          <span className="block text-xs leading-4 text-fg-muted">{user?.roles.join(', ')}</span>
        </span>
        <ChevronDown className="size-4 text-fg-muted" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 mt-1 w-56 rounded-md border border-border bg-white p-1 shadow-lg">
          <p className="truncate px-3 py-2 text-xs text-fg-muted">{user?.email}</p>
          <Link role="menuitem" to="/profile" onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded px-3 py-2 hover:bg-bg-subtle">
            <UserRound className="size-4" /> Hồ sơ & mật khẩu
          </Link>
          <button role="menuitem" type="button"
            className="flex w-full items-center gap-2 rounded px-3 py-2 text-danger hover:bg-danger-soft"
            onClick={async () => {
              await logout();
              navigate('/login', { replace: true });
            }}>
            <LogOut className="size-4" /> Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
}
