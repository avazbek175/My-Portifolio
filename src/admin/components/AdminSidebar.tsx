import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  ChevronDown,
  ExternalLink,
  FileText,
  Gauge,
  Image as ImageIcon,
  LayoutGrid,
  Mail,
  Settings,
  Shield,
  Sparkles,
  Wrench,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { initialsOf } from '@/admin/components/format';
import type { Admin } from '@/lib/cms-types';

type NavEntry = {
  to: string;
  label: string;
  icon: typeof Gauge;
  end?: boolean;
};

const primaryNav: NavEntry[] = [
  { to: '/admin', label: 'Dashboard', icon: Gauge, end: true },
  { to: '/admin/projects', label: 'Projects', icon: FileText },
  { to: '/admin/media', label: 'Media Library', icon: ImageIcon },
  { to: '/admin/messages', label: 'Messages', icon: Mail },
];

const contentChildren: NavEntry[] = [
  { to: '/admin/content?tab=pages', label: 'Pages & Settings', icon: LayoutGrid },
  { to: '/admin/content?tab=skills', label: 'Skills', icon: Sparkles },
  { to: '/admin/content?tab=experiences', label: 'Experience', icon: Wrench },
  { to: '/admin/content?tab=services', label: 'Services', icon: Wrench },
  { to: '/admin/content?tab=nav', label: 'Navigation', icon: LayoutGrid },
];

const secondaryNav: NavEntry[] = [
  { to: '/admin/audit', label: 'Audit Log', icon: Shield },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

const navItemClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
    isActive
      ? 'sidebar-active'
      : 'text-[color:var(--sidebar-foreground)] hover:bg-[color:var(--sidebar-accent)] hover:text-foreground',
  );

export const AdminSidebar = ({
  admin,
  open,
  onClose,
  showContent,
  onToggleContent,
}: {
  admin: Admin | null;
  open: boolean;
  onClose: () => void;
  showContent: boolean;
  onToggleContent: () => void;
}) => {
  const location = useLocation();
  const contentActive = location.pathname.startsWith('/admin/content');
  const [mobileContentOpen, setMobileContentOpen] = useState(contentActive);
  const contentExpanded = showContent || mobileContentOpen;

  const contentChildrenList = (
    <div className='mt-1 grid gap-0.5 pl-4'>
      {contentChildren.map((child) => (
        <NavLink
          key={child.to}
          to={child.to}
          onClick={onClose}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors duration-150',
              isActive
                ? 'bg-[color:var(--sidebar-accent)] text-foreground'
                : 'text-muted-foreground hover:bg-[color:var(--sidebar-accent)]/60 hover:text-foreground',
            )
          }
        >
          <span className='size-1.5 rounded-full bg-current opacity-50' />
          {child.label}
        </NavLink>
      ))}
    </div>
  );

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 flex w-72 shrink-0 flex-col border-r border-[color:var(--sidebar-border)] bg-[color:var(--sidebar)] transition-transform duration-200 lg:static lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full',
      )}
    >
      <div className='flex items-center justify-between px-5 py-5'>
        <Link to='/admin' className='flex items-center gap-2.5' onClick={onClose}>
          <span className='accent-gradient flex size-9 items-center justify-center rounded-xl text-sm font-bold text-white shadow-lg'>
            C
          </span>
          <span className='leading-tight'>
            <span className='block text-sm font-semibold tracking-tight text-foreground'>
              CYBERAVAZ
            </span>
            <span className='block text-[11px] text-muted-foreground'>Portfolio Admin</span>
          </span>
        </Link>
        <Button
          variant='ghost'
          size='icon-sm'
          className='lg:hidden'
          onClick={onClose}
          aria-label='Close menu'
        >
          <X />
        </Button>
      </div>

      <nav className='flex-1 space-y-1 overflow-y-auto px-3 pb-4'>
        {primaryNav.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink key={item.to} to={item.to} end={item.end} onClick={onClose} className={navItemClass}>
              <Icon className='size-4.5 shrink-0' />
              {item.label}
            </NavLink>
          );
        })}

        <div>
          <button
            type='button'
            onClick={() => {
              onToggleContent();
              setMobileContentOpen((value) => !value);
            }}
            aria-expanded={contentExpanded}
            className={cn(
              'group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
              contentActive
                ? 'sidebar-active'
                : 'text-[color:var(--sidebar-foreground)] hover:bg-[color:var(--sidebar-accent)] hover:text-foreground',
            )}
          >
            <Wrench className='size-4.5 shrink-0' />
            <span className='flex-1 text-left'>Content</span>
            <ChevronDown
              className={cn('size-4 transition-transform duration-200', contentExpanded && 'rotate-180')}
            />
          </button>
          {contentExpanded && contentChildrenList}
        </div>

        <div className='pt-2'>
          {secondaryNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} onClick={onClose} className={navItemClass}>
                <Icon className='size-4.5 shrink-0' />
                {item.label}
              </NavLink>
            );
          })}
        </div>
      </nav>

      <div className='border-t border-[color:var(--sidebar-border)] p-3'>
        <div className='mb-2 flex items-center gap-3 rounded-xl bg-[color:var(--sidebar-accent)]/60 px-3 py-2.5'>
          <span className='accent-gradient flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white'>
            {initialsOf(admin?.name ?? admin?.email ?? 'Admin')}
          </span>
          <span className='min-w-0'>
            <span className='block truncate text-sm font-medium text-foreground'>
              {admin?.name ?? 'Administrator'}
            </span>
            <span className='block truncate text-xs text-muted-foreground'>{admin?.email}</span>
          </span>
        </div>
        <Link
          to='/'
          onClick={onClose}
          className='flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-[color:var(--sidebar-accent)] hover:text-foreground'
        >
          <ExternalLink className='size-3.5' />
          View public site
        </Link>
      </div>
    </aside>
  );
};
