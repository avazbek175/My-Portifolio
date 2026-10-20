import { Link } from 'react-router-dom';
import { FileText, Image as ImageIcon, Mail } from 'lucide-react';

import {
  Card,
  ErrorBanner,
  LoadingState,
  PageHeader,
  StatusPill,
} from '@/admin/components/ui';
import { getDashboardStats } from '@/admin/admin-api';
import { useAsync } from '@/admin/hooks/useAsync';

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};

export const DashboardPage = () => {
  const { data, loading, error } = useAsync(() => getDashboardStats(), []);

  return (
    <div>
      <PageHeader
        title='Dashboard'
        description='Overview of your portfolio content.'
        actions={
          <Link
            to='/admin/projects/new'
            className='inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90'
          >
            New project
          </Link>
        }
      />

      <ErrorBanner message={error} />

      {loading && !data ? (
        <LoadingState />
      ) : data ? (
        <>
          <div className='grid gap-4 sm:grid-cols-3'>
            <Card>
              <div className='flex items-center justify-between'>
                <span className='text-sm text-muted-foreground'>Projects</span>
                <FileText className='size-4 text-primary' />
              </div>
              <p className='mt-3 text-3xl font-semibold text-foreground'>
                {data.projects.total}
              </p>
              <p className='mt-1 text-xs text-muted-foreground'>
                {data.projects.published} published · {data.projects.draft} draft ·{' '}
                {data.projects.featured} featured
              </p>
            </Card>

            <Card>
              <div className='flex items-center justify-between'>
                <span className='text-sm text-muted-foreground'>Media</span>
                <ImageIcon className='size-4 text-primary' />
              </div>
              <p className='mt-3 text-3xl font-semibold text-foreground'>
                {data.media.total}
              </p>
              <p className='mt-1 text-xs text-muted-foreground'>
                {formatBytes(data.media.totalBytes)} stored
              </p>
            </Card>

            <Card>
              <div className='flex items-center justify-between'>
                <span className='text-sm text-muted-foreground'>Messages</span>
                <Mail className='size-4 text-primary' />
              </div>
              <p className='mt-3 text-3xl font-semibold text-foreground'>
                {data.messages.total}
              </p>
              <p className='mt-1 text-xs text-muted-foreground'>
                {data.messages.unread} unread
              </p>
            </Card>
          </div>

          <Card className='mt-6'>
            <div className='flex items-center justify-between'>
              <h2 className='text-base font-semibold text-foreground'>
                Recently updated
              </h2>
              <Link
                to='/admin/projects'
                className='text-sm text-primary hover:underline'
              >
                View all
              </Link>
            </div>

            {data.recentProjects.length === 0 ? (
              <p className='mt-4 text-sm text-muted-foreground'>No projects yet.</p>
            ) : (
              <ul className='mt-4 divide-y divide-border'>
                {data.recentProjects.map((project) => (
                  <li
                    key={project.id}
                    className='flex items-center justify-between gap-4 py-3'
                  >
                    <Link
                      to={`/admin/projects/${project.id}`}
                      className='min-w-0 truncate text-sm font-medium text-foreground hover:text-primary'
                    >
                      {project.title}
                    </Link>
                    <div className='flex items-center gap-3'>
                      <span className='hidden text-xs text-muted-foreground sm:block'>
                        {new Date(project.updatedAt).toLocaleDateString()}
                      </span>
                      <StatusPill status={project.status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      ) : null}
    </div>
  );
};
