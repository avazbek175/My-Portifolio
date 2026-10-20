import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Pencil,
  Plus,
  Search as SearchIcon,
  Star,
  Trash2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  EmptyStateBlock,
  FilterSelect,
  Pagination,
  SearchInput,
  SectionCard,
  Skeleton,
  StatCard,
} from '@/admin/components/design';
import { formatRelative } from '@/admin/components/format';
import { ErrorBanner, PageHeader, StatusPill } from '@/admin/components/ui';
import { ConfirmDialog } from '@/admin/components/ConfirmDialog';
import { useToast } from '@/admin/components/toast-context';
import { cn } from '@/lib/utils';
import {
  deleteProject,
  listProjects,
  setProjectFeatured,
  setProjectStatus,
} from '@/admin/admin-api';
import { useAsync } from '@/admin/hooks/useAsync';
import type { Project } from '@/lib/cms-types';

type StatusFilter = 'all' | 'draft' | 'published';

export const ProjectsPage = () => {
  const toast = useToast();
  const [status, setStatus] = useState<StatusFilter>('all');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Project | null>(null);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(handle);
  }, [searchInput]);

  const { data, loading, error, reload } = useAsync(
    () =>
      listProjects({
        status: status === 'all' ? undefined : status,
        search: search || undefined,
        page,
        pageSize: 20,
      }),
    [status, search, page],
  );

  const stats = useMemo(() => {
    const items = data?.items ?? [];
    return {
      total: data?.total ?? 0,
      published: items.filter((project) => project.status === 'published').length,
      featured: items.filter((project) => project.featured).length,
    };
  }, [data]);

  const run = async (id: string, action: () => Promise<unknown>, successMessage?: string) => {
    setBusyId(id);
    try {
      await action();
      if (successMessage) toast.success(successMessage);
      reload();
    } catch (cause) {
      toast.error('Action failed', cause instanceof Error ? cause.message : undefined);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setBusyId(pendingDelete.id);
    try {
      await deleteProject(pendingDelete.id);
      toast.success('Project deleted', pendingDelete.title);
      setPendingDelete(null);
      if (data && data.items.length === 1 && page > 1) setPage((value) => value - 1);
      else reload();
    } catch (cause) {
      toast.error('Could not delete project', cause instanceof Error ? cause.message : undefined);
    } finally {
      setBusyId(null);
    }
  };

  const showEmpty = !loading && data && data.items.length === 0;

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Projects'
        description='Create, publish and reorder your portfolio projects.'
        actions={
          <Button asChild>
            <Link to='/admin/projects/new'>
              <Plus />
              New project
            </Link>
          </Button>
        }
      />

      <div className='grid gap-4 sm:grid-cols-3'>
        <StatCard label='Total projects' value={stats.total} icon={FileText} tone='primary' />
        <StatCard
          label='Published (page)'
          value={stats.published}
          icon={Star}
          tone='success'
        />
        <StatCard label='Featured (page)' value={stats.featured} icon={Star} tone='violet' />
      </div>

      <SectionCard>
        <div className='flex flex-col gap-3 border-b border-border/60 p-4 sm:flex-row sm:items-center'>
          <SearchInput
            value={searchInput}
            onChange={setSearchInput}
            placeholder='Search projects…'
            className='sm:max-w-xs'
          />
          <div className='flex items-center gap-2 sm:ml-auto'>
            <FilterSelect
              ariaLabel='Filter by status'
              value={status}
              onChange={(value) => {
                setStatus(value as StatusFilter);
                setPage(1);
              }}
              options={[
                { value: 'all', label: 'All statuses' },
                { value: 'published', label: 'Published' },
                { value: 'draft', label: 'Draft' },
              ]}
            />
          </div>
        </div>

        <div className='p-4'>
          <ErrorBanner message={error} />

          {loading && !data ? (
            <div className='space-y-2'>
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className='h-16 rounded-xl' />
              ))}
            </div>
          ) : showEmpty ? (
            <EmptyStateBlock
              icon={search ? SearchIcon : FileText}
              title={search ? 'No projects match your search' : 'No projects yet'}
              description={
                search
                  ? 'Try a different search term or clear the filters.'
                  : 'Create your first project to show it on the public site.'
              }
              action={
                !search ? (
                  <Button asChild className='mt-1'>
                    <Link to='/admin/projects/new'>
                      <Plus />
                      New project
                    </Link>
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <ul className='space-y-2'>
              {data?.items.map((project) => (
                <li
                  key={project.id}
                  className='surface-hover flex flex-wrap items-center gap-3 rounded-xl border border-border/60 p-2.5 sm:flex-nowrap'
                >
                  <div className='size-14 shrink-0 overflow-hidden rounded-lg border border-border/60 bg-[color:var(--muted)]/40'>
                    {project.coverUrl ? (
                      <img
                        src={project.coverUrl}
                        alt={project.title}
                        loading='lazy'
                        className='size-full object-cover'
                      />
                    ) : (
                      <span className='flex size-full items-center justify-center text-muted-foreground'>
                        <FileText className='size-5' />
                      </span>
                    )}
                  </div>

                  <div className='min-w-0 flex-1'>
                    <Link
                      to={`/admin/projects/${project.id}`}
                      className='flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary'
                    >
                      <span className='truncate'>{project.title}</span>
                      {project.featured && (
                        <Star className='size-3.5 shrink-0 fill-[color:var(--admin-warning)] text-[color:var(--admin-warning)]' />
                      )}
                    </Link>
                    <p className='truncate text-xs text-muted-foreground'>
                      /{project.slug}
                      {project.category ? ` · ${project.category}` : ''} · updated{' '}
                      {formatRelative(project.updatedAt)}
                    </p>
                  </div>

                  <div className='flex items-center gap-2'>
                    <StatusPill status={project.status} />
                    <Button
                      variant='ghost'
                      size='sm'
                      disabled={busyId === project.id}
                      onClick={() =>
                        run(
                          project.id,
                          () => setProjectStatus(project.id, project.status === 'published' ? 'draft' : 'published'),
                          project.status === 'published' ? 'Moved to draft' : 'Project published',
                        )
                      }
                    >
                      {project.status === 'published' ? 'Unpublish' : 'Publish'}
                    </Button>
                    <Button
                      variant='ghost'
                      size='icon-sm'
                      disabled={busyId === project.id}
                      title={project.featured ? 'Unfeature' : 'Feature'}
                      aria-label={project.featured ? 'Unfeature project' : 'Feature project'}
                      onClick={() =>
                        run(
                          project.id,
                          () => setProjectFeatured(project.id, !project.featured),
                          project.featured ? 'Removed from featured' : 'Marked as featured',
                        )
                      }
                    >
                      <Star
                        className={cn(
                          'size-4',
                          project.featured && 'fill-[color:var(--admin-warning)] text-[color:var(--admin-warning)]',
                        )}
                      />
                    </Button>
                    <Button asChild variant='ghost' size='icon-sm' title='Edit' aria-label='Edit project'>
                      <Link to={`/admin/projects/${project.id}`}>
                        <Pencil className='size-4' />
                      </Link>
                    </Button>
                    <Button
                      variant='ghost'
                      size='icon-sm'
                      title='Delete'
                      aria-label='Delete project'
                      disabled={busyId === project.id}
                      onClick={() => setPendingDelete(project)}
                    >
                      <Trash2 className='size-4 text-destructive' />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {data && (
            <Pagination
              page={data.page}
              pageSize={data.pageSize}
              total={data.total}
              onPageChange={setPage}
            />
          )}
        </div>
      </SectionCard>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDelete}
        destructive
        confirmLabel='Delete project'
        title='Delete this project?'
        description={
          pendingDelete
            ? `“${pendingDelete.title}” will be permanently removed. This cannot be undone.`
            : undefined
        }
      />
    </div>
  );
};
