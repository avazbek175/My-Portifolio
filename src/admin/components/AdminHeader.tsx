import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, LogOut, Menu, Search, Settings, User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { initialsOf } from '@/admin/components/format';
import type { Admin } from '@/lib/cms-types';

export const AdminHeader = ({
  admin,
  unreadCount,
  searchValue,
  onSearchChange,
  searchResults,
  onOpenMenu,
  onLogout,
}: {
  admin: Admin | null;
  unreadCount: number;
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchResults: Array<{ to: string; label: string; hint?: string }>;
  onOpenMenu: () => void;
  onLogout: () => void;
}) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [menuOpen]);

  const trimmed = searchValue.trim();

  return (
    <header className='sticky top-0 z-30 flex items-center gap-3 border-b border-border/70 bg-[color:var(--background)]/80 px-4 py-3 backdrop-blur-xl sm:px-6'>
      <Button
        variant='ghost'
        size='icon-sm'
        className='lg:hidden'
        onClick={onOpenMenu}
        aria-label='Open menu'
      >
        <Menu />
      </Button>

      <div className='relative flex-1 max-w-md'>
        <div className='relative'>
          <Search className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
          <input
            ref={searchRef}
            type='search'
            value={searchValue}
            aria-label='Global search'
            placeholder='Search…'
            onChange={(event) => onSearchChange(event.target.value)}
            className='h-10 w-full rounded-xl border border-border bg-[color:var(--muted)]/40 pl-9 pr-16 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40'
          />
          <span className='pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 sm:block'>
            <span className='kbd'>Ctrl</span> <span className='kbd'>K</span>
          </span>
        </div>

        {trimmed && (
          <div className='surface absolute inset-x-0 top-12 z-40 max-h-80 overflow-y-auto rounded-xl p-1.5 shadow-2xl'>
            {searchResults.length === 0 ? (
              <p className='px-3 py-6 text-center text-sm text-muted-foreground'>
                No matches for “{trimmed}”.
              </p>
            ) : (
              searchResults.map((result) => (
                <button
                  key={result.to}
                  type='button'
                  onClick={() => {
                    navigate(result.to);
                    onSearchChange('');
                  }}
                  className='flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50'
                >
                  <span className='truncate text-sm text-foreground'>{result.label}</span>
                  {result.hint && (
                    <span className='shrink-0 text-xs text-muted-foreground'>{result.hint}</span>
                  )}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <div className='ml-auto flex items-center gap-1.5'>
        <Link
          to='/admin/messages'
          aria-label={`Messages${unreadCount ? `, ${unreadCount} unread` : ''}`}
          className='relative flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-[color:var(--accent)] hover:text-foreground'
        >
          <Bell className='size-4.5' />
          {unreadCount > 0 && (
            <span className='absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-4 text-white'>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Link>

        <div className='relative' ref={menuRef}>
          <button
            type='button'
            onClick={() => setMenuOpen((value) => !value)}
            aria-haspopup='menu'
            aria-expanded={menuOpen}
            className='flex items-center gap-2 rounded-xl border border-border bg-[color:var(--muted)]/40 py-1.5 pl-1.5 pr-2 transition-colors hover:border-ring/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50'
          >
            <span className='accent-gradient flex size-7 items-center justify-center rounded-full text-[11px] font-semibold text-white'>
              {initialsOf(admin?.name ?? admin?.email ?? 'Admin')}
            </span>
            <span className='hidden max-w-[10rem] truncate text-sm text-foreground sm:block'>
              {admin?.name ?? 'Admin'}
            </span>
            <ChevronDown className='size-4 text-muted-foreground' />
          </button>

          {menuOpen && (
            <div
              role='menu'
              className='surface absolute right-0 top-12 z-40 w-56 overflow-hidden rounded-xl p-1.5 shadow-2xl'
            >
              <div className='px-3 py-2'>
                <p className='truncate text-sm font-medium text-foreground'>
                  {admin?.name ?? 'Administrator'}
                </p>
                <p className='truncate text-xs text-muted-foreground'>{admin?.email}</p>
              </div>
              <div className='my-1 h-px bg-border/60' />
              <Link
                to='/admin/settings'
                role='menuitem'
                onClick={() => setMenuOpen(false)}
                className='flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-[color:var(--accent)]'
              >
                <User className='size-4' />
                Profile
              </Link>
              <Link
                to='/admin/settings'
                role='menuitem'
                onClick={() => setMenuOpen(false)}
                className='flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-[color:var(--accent)]'
              >
                <Settings className='size-4' />
                Settings
              </Link>
              <div className='my-1 h-px bg-border/60' />
              <button
                type='button'
                role='menuitem'
                onClick={() => {
                  setMenuOpen(false);
                  onLogout();
                }}
                className='flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10'
              >
                <LogOut className='size-4' />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
