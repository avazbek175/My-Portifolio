import { useEffect, useMemo, useState } from 'react';
import { Grid2X2, Image as ImageIcon, List, Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  CardSkeletonGrid,
  EmptyStateBlock,
  FilterSelect,
  Pagination,
  SearchInput,
  SectionCard,
  Skeleton,
  StatCard,
} from '@/admin/components/design';
import { formatBytes } from '@/admin/components/format';
import { PageHeader, ErrorBanner } from '@/admin/components/ui';
import { ConfirmDialog } from '@/admin/components/ConfirmDialog';
import { UploadDialog } from '@/admin/components/UploadDialog';
import { MediaCard } from '@/admin/components/MediaCard';
import { useToast } from '@/admin/components/toast-context';
import { listMedia, deleteMedia } from '@/admin/admin-api';
import { useAsync } from '@/admin/hooks/useAsync';
import { cn } from '@/lib/utils';
import type { MediaItem } from '@/lib/cms-types';

const PAGE_SIZE = 24;

export const MediaPage = () => {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<MediaItem | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebounced(search.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(handle);
  }, [search]);

  const { data, loading, error, reload } = useAsync(
    () => listMedia({ page, pageSize: PAGE_SIZE, search: debounced || undefined, sort }),
    [page, debounced, sort],
  );

  const stats = useMemo(() => {
    const totalBytes = (data?.items ?? []).reduce((sum, item) => sum + item.sizeBytes, 0);
    return { total: data?.total ?? 0, pageBytes: totalBytes };
  }, [data]);

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setBusyId(pendingDelete.id);
    try {
      await deleteMedia(pendingDelete.id);
      toast.success('Image deleted', pendingDelete.filename);
      setPendingDelete(null);
      if (data && data.items.length === 1 && page > 1) setPage((value) => value - 1);
      else reload();
    } catch (cause) {
      toast.error(
        'Could not delete image',
        cause instanceof Error ? cause.message : undefined,
      );
    } finally {
      setBusyId(null);
    }
  };

  const showEmpty = !loading && data && data.items.length === 0;

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Media Library'
        description='Upload, organise and reuse every image across your portfolio.'
        actions={
          <Button onClick={() => setUploadOpen(true)}>
            <Upload />
            Upload images
          </Button>
        }
      />

      <div className='grid gap-4 sm:grid-cols-3'>
        <StatCard
          label='Total images'
          value={stats.total}
          icon={ImageIcon}
          tone='primary'
        />
        <StatCard
          label='On this page'
          value={(data?.items ?? []).length}
          hint={formatBytes(stats.pageBytes)}
          icon={Grid2X2}
          tone='violet'
        />
        <StatCard
          label='Formats'
          value={
            new Set((data?.items ?? []).map((item) => item.format).filter(Boolean)).size || 0
          }
          hint='Distinct formats on this page'
          icon={List}
          tone='success'
        />
      </div>

      <SectionCard>
        <div className='flex flex-col gap-3 border-b border-border/60 p-4 sm:flex-row sm:items-center'>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder='Search by filename…'
            className='sm:max-w-xs'
          />
          <div className='flex items-center gap-2 sm:ml-auto'>
            <FilterSelect
              ariaLabel='Sort order'
              value={sort}
              onChange={(value) => setSort(value as 'newest' | 'oldest')}
              options={[
                { value: 'newest', label: 'Newest first' },
                { value: 'oldest', label: 'Oldest first' },
              ]}
            />
            <div className='flex items-center rounded-xl border border-border p-0.5'>
              {(['grid', 'list'] as const).map((mode) => (
                <button
                  key={mode}
                  type='button'
                  onClick={() => setView(mode)}
                  aria-label={`${mode} view`}
                  aria-pressed={view === mode}
                  className={cn(
                    'flex size-9 items-center justify-center rounded-lg transition-colors',
                    view === mode
                      ? 'bg-[color:var(--accent)] text-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {mode === 'grid' ? <Grid2X2 className='size-4' /> : <List className='size-4' />}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className='p-4'>
          <ErrorBanner message={error} />

          {loading && !data ? (
            <CardSkeletonGrid count={8} />
          ) : showEmpty ? (
            <EmptyStateBlock
              icon={ImageIcon}
              title={debounced ? 'No images match your search' : 'No media yet'}
              description={
                debounced
                  ? 'Try a different filename or clear the search.'
                  : 'Upload your first image to start building your library.'
              }
              action={
                !debounced ? (
                  <Button className='mt-1' onClick={() => setUploadOpen(true)}>
                    <Upload />
                    Upload images
                  </Button>
                ) : undefined
              }
            />
          ) : view === 'grid' ? (
            <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5'>
              {data?.items.map((item) => (
                <MediaCard
                  key={item.id}
                  item={item}
                  view='grid'
                  busy={busyId === item.id}
                  onDelete={setPendingDelete}
                />
              ))}
              {loading &&
                Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={`skeleton-${index}`} className='aspect-square w-full rounded-2xl' />
                ))}
            </div>
          ) : (
            <div className='space-y-2'>
              {data?.items.map((item) => (
                <MediaCard
                  key={item.id}
                  item={item}
                  view='list'
                  busy={busyId === item.id}
                  onDelete={setPendingDelete}
                />
              ))}
            </div>
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

      <UploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={() => {
          setPage(1);
          reload();
          toast.success('Images uploaded');
        }}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDelete}
        destructive
        confirmLabel='Delete image'
        title='Delete this image?'
        description={
          pendingDelete
            ? `“${pendingDelete.filename}” will be permanently removed. This cannot be undone.`
            : undefined
        }
      >
        {pendingDelete && (
          <div className='flex items-center gap-3 rounded-xl border border-border/60 p-3'>
            <img
              src={pendingDelete.url}
              alt={pendingDelete.filename}
              className='size-16 rounded-lg object-cover'
            />
            <div className='min-w-0 text-sm'>
              <p className='truncate font-medium text-foreground'>{pendingDelete.filename}</p>
              <p className='text-xs text-muted-foreground'>
                {pendingDelete.width && pendingDelete.height
                  ? `${pendingDelete.width}×${pendingDelete.height} · `
                  : ''}
                {formatBytes(pendingDelete.sizeBytes)}
              </p>
            </div>
          </div>
        )}
      </ConfirmDialog>
    </div>
  );
};
