import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  ExternalLink,
  FileText,
  Gauge,
  Image as ImageIcon,
  LogOut,
  Mail,
  Menu,
  Settings,
  Shield,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/useAuth';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: Gauge, end: true },
  { to: '/admin/projects', label: 'Projects', icon: FileText },
  { to: '/admin/media', label: 'Media', icon: ImageIcon },
  { to: '/admin/messages', label: 'Messages', icon: Mail },
  { to: '/admin/content', label: 'Content', icon: Settings },
  { to: '/admin/audit', label: 'Audit log', icon: Shield },
];

export const AdminLayout = () => {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className='min-h-screen bg-background'>
      <div className='mx-auto flex w-full max-w-7xl'>
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-40 w-64 shrink-0 border-r border-border bg-card p-4 transition-transform lg:static lg:translate-x-0',
            open ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <div className='flex items-center justify-between'>
            <Link to='/admin' className='flex items-center gap-2'>
              <span className='flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground'>
                A
              </span>
              <span className='text-sm font-semibold text-foreground'>Admin</span>
            </Link>
            <Button
              variant='ghost'
              size='icon-sm'
              className='lg:hidden'
              onClick={() => setOpen(false)}
              aria-label='Close menu'
            >
              <X />
            </Button>
          </div>

          <nav className='mt-6 grid gap-1'>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                    )
                  }
                >
                  <Icon className='size-4' />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          <div className='absolute inset-x-4 bottom-4 border-t border-border pt-4'>
            <Link
              to='/'
              className='flex items-center gap-2 text-xs text-muted-foreground hover:text-primary'
            >
              <ExternalLink className='size-3.5' />
              View public site
            </Link>
          </div>
        </aside>

        {open && (
          <button
            type='button'
            aria-label='Close menu overlay'
            className='fixed inset-0 z-30 bg-background/60 lg:hidden'
            onClick={() => setOpen(false)}
          />
        )}

        <div className='flex min-w-0 flex-1 flex-col'>
          <header className='sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur sm:px-6'>
            <div className='flex items-center gap-3'>
              <Button
                variant='ghost'
                size='icon-sm'
                className='lg:hidden'
                onClick={() => setOpen(true)}
                aria-label='Open menu'
              >
                <Menu />
              </Button>
              <span className='text-sm text-muted-foreground'>
                {admin?.email}
              </span>
            </div>
            <div className='flex items-center gap-2'>
              <Button asChild variant='outline' size='sm'>
                <Link to='/admin/settings'>
                  <Settings />
                  Account
                </Link>
              </Button>
              <Button variant='ghost' size='sm' onClick={handleLogout}>
                <LogOut />
                Sign out
              </Button>
            </div>
          </header>

          <div className='mx-auto w-full max-w-5xl px-4 py-6 sm:px-6'>
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};
