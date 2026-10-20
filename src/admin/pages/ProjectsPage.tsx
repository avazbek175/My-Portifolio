import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Plus, Search, Star, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  EmptyState,
  ErrorBanner,
  LoadingState,
  PageHeader,
  StatusPill,
} from '@/admin/components/ui';
import { cn } from '@/lib/utils';
import {
  deleteProject,
  listProjects,
  setProjectFeatured,
  setProjectStatus,
} from '@/admin/admin-api';
import { useAsync } from '@/admin/hooks/useAsync';

type StatusFilter = 'all' | 'draft' | 'published';

const filters: StatusFilter[] = ['all', 'published', 'draft'];

export const ProjectsPage = () => {
  const [status, setStatus] = useState<StatusFilter>('all');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

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

  const run = async (id: string, action: () => Promise<unknown>) => {
    setBusyId(id);
    setActionError(null);
    try {
      await action();
      reload();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Action failed');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = (id: string, title: string) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    void run(id, () => deleteProject(id));
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div>
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

      <div className='mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex gap-1 rounded-lg border border-border p-1'>
          {filters.map((filter) => (
            <button
              key={filter}
              type='button'
              onClick={() => {
                setStatus(filter);
                setPage(1);
              }}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm capitalize transition-colors',
                status === filter
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {filter}
            </button>
          ))}
        </div>

        <form
          className='flex w-full gap-2 sm:w-auto'
          onSubmit={(event) => {
            event.preventDefault();
            setSearch(searchInput.trim());
            setPage(1);
          }}
        >
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder='Search projects…'
          />
          <Button type='submit' variant='outline' size='icon' aria-label='Search'>
            <Search />
          </Button>
        </form>
      </div>

      <ErrorBanner message={error ?? actionError} />

      {loading && !data ? (
        <LoadingState />
      ) : data && data.items.length > 0 ? (
        <div className='overflow-hidden rounded-2xl border border-border'>
          <table className='w-full text-sm'>
            <thead className='bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground'>
              <tr>
                <th className='px-4 py-3 font-medium'>Title</th>
                <th className='hidden px-4 py-3 font-medium sm:table-cell'>Category</th>
                <th className='px-4 py-3 font-medium'>Status</th>
                <th className='px-4 py-3 text-right font-medium'>Actions</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-border'>
              {data.items.map((project) => (
                <tr key={project.id} className='bg-card'>
                  <td className='px-4 py-3'>
                    <Link
                      to={`/admin/projects/${project.id}`}
                      className='font-medium text-foreground hover:text-primary'
                    >
                      {project.title}
                    </Link>
                    <div className='text-xs text-muted-foreground'>/{project.slug}</div>
                  </td>
                  <td className='hidden px-4 py-3 text-muted-foreground sm:table-cell'>
                    {project.category}
                  </td>
                  <td className='px-4 py-3'>
                    <div className='flex items-center gap-2'>
                      <StatusPill status={project.status} />
                      {project.featured && (
                        <Star className='size-3.5 fill-primary text-primary' />
                      )}
                    </div>
                  </td>
                  <td className='px-4 py-3'>
                    <div className='flex items-center justify-end gap-1'>
                      <Button
                        variant='ghost'
                        size='icon-sm'
                        disabled={busyId === project.id}
                        title={project.featured ? 'Unfeature' : 'Feature'}
                        onClick={() =>
                          run(project.id, () =>
                            setProjectFeatured(project.id, !project.featured),
                          )
                        }
                      >
                        <Star
                          className={cn(
                            'size-4',
                            project.featured && 'fill-primary text-primary',
                          )}
                        />
                      </Button>
                      <Button
                        variant='ghost'
                        size='sm'
                        disabled={busyId === project.id}
                        onClick={() =>
                          run(project.id, () =>
                            setProjectStatus(
                              project.id,
                              project.status === 'published' ? 'draft' : 'published',
                            ),
                          )
                        }
                      >
                        {project.status === 'published' ? 'Unpublish' : 'Publish'}
                      </Button>
                      <Button asChild variant='ghost' size='icon-sm' title='Edit'>
                        <Link to={`/admin/projects/${project.id}`}>
                          <Pencil />
                        </Link>
                      </Button>
                      <Button
                        variant='ghost'
                        size='icon-sm'
                        title='Delete'
                        disabled={busyId === project.id}
                        onClick={() => handleDelete(project.id, project.title)}
                      >
                        <Trash2 className='text-destructive' />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title='No projects yet'
          description='Create your first project to show it on the public site.'
          action={
            <Button asChild className='mt-2'>
              <Link to='/admin/projects/new'>
                <Plus />
                New project
              </Link>
            </Button>
          }
        />
      )}

      {data && data.total > data.pageSize && (
        <div className='mt-4 flex items-center justify-between text-sm text-muted-foreground'>
          <span>
            Page {data.page} of {totalPages} · {data.total} total
          </span>
          <div className='flex gap-2'>
            <Button
              variant='outline'
              size='sm'
              disabled={page <= 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
            >
              Previous
            </Button>
            <Button
              variant='outline'
              size='sm'
              disabled={page >= totalPages}
              onClick={() => setPage((value) => value + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
