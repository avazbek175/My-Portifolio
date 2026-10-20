import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, ErrorBanner, LoadingState, PageHeader } from '@/admin/components/ui';
import { listMedia, deleteMedia, uploadMedia } from '@/admin/admin-api';
import { useAsync } from '@/admin/hooks/useAsync';

export const MediaPage = () => {
  const [nonce, setNonce] = useState(0);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const { data, loading } = useAsync(
    () => listMedia({ page, pageSize: 24, search: search || undefined }),
    [page, search, nonce],
  );

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        await uploadMedia(file);
      }
      setNonce((v) => v + 1);
      setPage(1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this image?')) return;
    setBusy(id);
    setError(null);
    try {
      await deleteMedia(id);
      setNonce((v) => v + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Delete failed');
    } finally {
      setBusy(null);
    }
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div>
      <PageHeader
        title='Media library'
        description='Upload and manage images used across the site.'
        actions={
          <label className='inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm hover:bg-muted/50'>
            <input
              type='file'
              accept='image/*'
              multiple
              hidden
              onChange={(e) => handleUpload(e.target.files)}
            />
            {uploading ? 'Uploading…' : 'Upload images'}
          </label>
        }
      />

      <div className='mb-5 flex items-center gap-2'>
        <Input
          placeholder='Search by filename…'
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      <ErrorBanner message={error} />

      {loading && !data ? (
        <LoadingState />
      ) : data && data.items.length > 0 ? (
        <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'>
          {data.items.map((item) => (
            <div
              key={item.id}
              className='group relative overflow-hidden rounded-xl border border-border'
            >
              <img
                src={item.url}
                alt={item.filename}
                loading='lazy'
                className='aspect-square w-full object-cover'
              />
              <div className='absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-background/90 to-transparent px-2 py-2 opacity-0 transition-opacity group-hover:opacity-100'>
                <span className='truncate text-xs text-foreground'>{item.filename}</span>
                <Button
                  variant='ghost'
                  size='icon-sm'
                  disabled={busy === item.id}
                  onClick={() => handleDelete(item.id)}
                  aria-label='Delete'
                >
                  ×
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card className='flex flex-col items-center justify-center py-16 text-center'>
          <p className='text-base font-medium text-foreground'>No media yet</p>
          <p className='mt-1 text-sm text-muted-foreground'>
            Upload images using the button above.
          </p>
        </Card>
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
              onClick={() => setPage((v) => Math.max(1, v - 1))}
            >
              Previous
            </Button>
            <Button
              variant='outline'
              size='sm'
              disabled={page >= totalPages}
              onClick={() => setPage((v) => v + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
