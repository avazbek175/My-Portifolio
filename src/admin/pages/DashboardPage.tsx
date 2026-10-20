import { Link } from 'react-router-dom';
import {
  ArrowRight,
  FileText,
  Image as ImageIcon,
  Mail,
  Plus,
  Sparkles,
  Upload,
} from 'lucide-react';

import {
  EmptyStateBlock,
  SectionCard,
  SectionHeader,
  Skeleton,
  StatCard,
} from '@/admin/components/design';
import { formatBytes, formatRelative } from '@/admin/components/format';
import { PageHeader, ErrorBanner } from '@/admin/components/ui';
import { StatusPill } from '@/admin/components/ui';
import { getDashboardStats } from '@/admin/admin-api';
import { useAsync } from '@/admin/hooks/useAsync';

const quickActions = [
  { to: '/admin/projects/new', label: 'New project', icon: Plus },
  { to: '/admin/media', label: 'Upload media', icon: Upload },
  { to: '/admin/messages', label: 'Inbox', icon: Mail },
  { to: '/admin/content', label: 'Edit content', icon: Sparkles },
];

export const DashboardPage = () => {
  const { data, loading, error } = useAsync(() => getDashboardStats(), []);

  if (loading && !data) {
    return (
      <div className='space-y-6'>
        <PageHeader title='Dashboard' description='Overview of your portfolio content.' />
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className='h-28 rounded-2xl' />
          ))}
        </div>
        <Skeleton className='h-64 rounded-2xl' />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Dashboard'
        description='Overview of your portfolio content.'
        actions={
          <Link
            to='/admin/projects/new'
            className='inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90'
          >
            <Plus className='size-4' />
            New project
          </Link>
        }
      />

      <ErrorBanner message={error} />

      {data && (
        <>
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
            <StatCard
              label='Projects'
              value={data.projects.total}
              hint={`${data.projects.published} published · ${data.projects.draft} draft`}
              icon={FileText}
              tone='primary'
            />
            <StatCard
              label='Media'
              value={data.media.total}
              hint={`${formatBytes(data.media.totalBytes)} stored`}
              icon={ImageIcon}
              tone='violet'
            />
            <StatCard
              label='Messages'
              value={data.messages.total}
              hint={`${data.messages.unread} unread`}
              icon={Mail}
              tone={data.messages.unread > 0 ? 'warning' : 'success'}
            />
            <StatCard
              label='Featured'
              value={data.projects.featured}
              hint='Highlighted on the home page'
              icon={Sparkles}
              tone='success'
            />
          </div>

          <SectionCard>
            <SectionHeader title='Quick actions' />
            <div className='grid grid-cols-2 gap-3 p-4 sm:grid-cols-4'>
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.to}
                    to={action.to}
                    className='surface-hover flex flex-col items-start gap-2 rounded-xl border border-border/60 p-4 text-sm font-medium text-foreground'
                  >
                    <span className='accent-gradient flex size-9 items-center justify-center rounded-xl text-white'>
                      <Icon className='size-4.5' />
                    </span>
                    {action.label}
                  </Link>
                );
              })}
            </div>
          </SectionCard>

          <div className='grid gap-6 lg:grid-cols-2'>
            <SectionCard>
              <SectionHeader
                title='Recently updated projects'
                actions={
                  <Link
                    to='/admin/projects'
                    className='inline-flex items-center gap-1 text-xs text-primary hover:underline'
                  >
                    View all <ArrowRight className='size-3.5' />
                  </Link>
                }
              />
              <div className='p-2'>
                {data.recentProjects.length === 0 ? (
                  <p className='px-3 py-8 text-center text-sm text-muted-foreground'>
                    No projects yet.
                  </p>
                ) : (
                  <ul className='divide-y divide-border/60'>
                    {data.recentProjects.map((project) => (
                      <li key={project.id}>
                        <Link
                          to={`/admin/projects/${project.id}`}
                          className='flex items-center justify-between gap-4 rounded-lg px-3 py-3 transition-colors hover:bg-[color:var(--accent)]/50'
                        >
                          <span className='min-w-0'>
                            <span className='block truncate text-sm font-medium text-foreground'>
                              {project.title}
                            </span>
                            <span className='block text-xs text-muted-foreground'>
                              Updated {formatRelative(project.updatedAt)}
                            </span>
                          </span>
                          <StatusPill status={project.status} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </SectionCard>

            <SectionCard>
              <SectionHeader
                title='Recent messages'
                actions={
                  <Link
                    to='/admin/messages'
                    className='inline-flex items-center gap-1 text-xs text-primary hover:underline'
                  >
                    View all <ArrowRight className='size-3.5' />
                  </Link>
                }
              />
              <div className='p-2'>
                {data.recentMessages.length === 0 ? (
                  <p className='px-3 py-8 text-center text-sm text-muted-foreground'>
                    No messages yet.
                  </p>
                ) : (
                  <ul className='divide-y divide-border/60'>
                    {data.recentMessages.map((message) => (
                      <li key={message.id}>
                        <Link
                          to='/admin/messages'
                          className='flex items-center justify-between gap-4 rounded-lg px-3 py-3 transition-colors hover:bg-[color:var(--accent)]/50'
                        >
                          <span className='min-w-0'>
                            <span className='block truncate text-sm font-medium text-foreground'>
                              {message.subject}
                            </span>
                            <span className='block truncate text-xs text-muted-foreground'>
                              {message.name} · {formatRelative(message.createdAt)}
                            </span>
                          </span>
                          <StatusPill status={message.status} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </SectionCard>
          </div>

          <SectionCard>
            <SectionHeader
              title='Recent media'
              actions={
                <Link
                  to='/admin/media'
                  className='inline-flex items-center gap-1 text-xs text-primary hover:underline'
                >
                  Open library <ArrowRight className='size-3.5' />
                </Link>
              }
            />
            <div className='p-4'>
              {data.recentMedia.length === 0 ? (
                <EmptyStateBlock
                  icon={ImageIcon}
                  title='No media uploaded yet'
                  description='Your recent uploads will appear here.'
                  action={
                    <Link
                      to='/admin/media'
                      className='mt-1 inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90'
                    >
                      <Upload className='size-4' />
                      Upload images
                    </Link>
                  }
                />
              ) : (
                <div className='grid grid-cols-3 gap-3 sm:grid-cols-6'>
                  {data.recentMedia.map((item) => (
                    <Link
                      key={item.id}
                      to='/admin/media'
                      className='group relative aspect-square overflow-hidden rounded-xl border border-border/60'
                    >
                      <img
                        src={item.url}
                        alt={item.filename}
                        loading='lazy'
                        className='size-full object-cover transition-transform duration-300 group-hover:scale-105'
                      />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </SectionCard>
        </>
      )}
    </div>
  );
};
