import { useEffect, useMemo, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';

import { useAuth } from '@/context/useAuth';
import { AdminSidebar } from '@/admin/components/AdminSidebar';
import { AdminHeader } from '@/admin/components/AdminHeader';
import { ToastProvider } from '@/admin/components/Toast';
import { getDashboardStats, listMedia, listMessages, listProjects } from '@/admin/admin-api';

type SearchResult = { to: string; label: string; hint?: string };

export const AdminLayout = () => {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [contentOpen, setContentOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchValue, setSearchValue] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);

  useEffect(() => {
    let cancelled = false;
    getDashboardStats()
      .then((stats) => {
        if (!cancelled) setUnreadCount(stats.messages.unread);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const query = searchValue.trim();
    let cancelled = false;
    const handle = window.setTimeout(async () => {
      if (query.length < 2) {
        if (!cancelled) setResults([]);
        return;
      }
      try {
        const [projects, media, messages] = await Promise.all([
          listProjects({ search: query, pageSize: 5 }),
          listMedia({ search: query, pageSize: 5 }),
          listMessages({ search: query, pageSize: 5 }),
        ]);
        if (cancelled) return;
        const matches: SearchResult[] = [
          ...projects.items.map((project) => ({
            to: `/admin/projects/${project.id}`,
            label: project.title,
            hint: 'Project',
          })),
          ...media.items.map((item) => ({
            to: `/admin/media`,
            label: item.filename,
            hint: 'Media',
          })),
          ...messages.items.map((message) => ({
            to: `/admin/messages`,
            label: `${message.name} — ${message.subject}`,
            hint: 'Message',
          })),
        ];
        setResults(matches.slice(0, 10));
      } catch {
        if (!cancelled) setResults([]);
      }
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [searchValue]);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login', { replace: true });
  };

  const sidebar = useMemo(
    () => (
      <AdminSidebar
        admin={admin}
        open={open}
        onClose={() => setOpen(false)}
        showContent={contentOpen}
        onToggleContent={() => setContentOpen((value) => !value)}
      />
    ),
    [admin, open, contentOpen],
  );

  return (
    <ToastProvider>
      <div className='admin-shell min-h-screen'>
        <div className='flex w-full'>
          {sidebar}

          {open && (
            <button
              type='button'
              aria-label='Close menu overlay'
              className='fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden'
              onClick={() => setOpen(false)}
            />
          )}

          <div className='flex min-w-0 flex-1 flex-col'>
            <AdminHeader
              admin={admin}
              unreadCount={unreadCount}
              searchValue={searchValue}
              onSearchChange={setSearchValue}
              searchResults={results}
              onOpenMenu={() => setOpen(true)}
              onLogout={handleLogout}
            />

            <main className='mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8'>
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </ToastProvider>
  );
};
