import { useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState, ErrorBanner, LoadingState } from '@/admin/components/ui';
import { listMedia, uploadMedia } from '@/admin/admin-api';
import { useAsync } from '@/admin/hooks/useAsync';

type MediaPickerProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
};

export const MediaPicker = ({ open, onClose, onSelect }: MediaPickerProps) => {
  const [nonce, setNonce] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data, loading } = useAsync(
    () => (open ? listMedia({ pageSize: 60 }) : Promise.resolve(null)),
    [open, nonce],
  );

  if (!open) return null;

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        const result = await uploadMedia(file);
        const first = result.items[0];
        if (first) onSelect(first.url);
      }
      setNonce((value) => value + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm'>
      <div className='flex max-h-[85vh] w-full max-w-3xl flex-col rounded-2xl border border-border bg-card'>
        <div className='flex items-center justify-between border-b border-border px-5 py-3'>
          <h2 className='text-base font-semibold text-foreground'>Media library</h2>
          <div className='flex items-center gap-2'>
            <input
              ref={fileRef}
              type='file'
              accept='image/*'
              multiple
              hidden
              onChange={(event) => handleUpload(event.target.files)}
            />
            <Button
              size='sm'
              variant='outline'
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              <Upload />
              Upload
            </Button>
            <Button variant='ghost' size='icon-sm' onClick={onClose} aria-label='Close'>
              <X />
            </Button>
          </div>
        </div>

        <div className='overflow-y-auto p-4'>
          <ErrorBanner message={error} />
          {loading && !data ? (
            <LoadingState />
          ) : data && data.items.length > 0 ? (
            <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
              {data.items.map((item) => (
                <button
                  key={item.id}
                  type='button'
                  onClick={() => {
                    onSelect(item.url);
                    onClose();
                  }}
                  className='group overflow-hidden rounded-xl border border-border bg-background transition-colors hover:border-primary'
                >
                  <img
                    src={item.url}
                    alt={item.filename}
                    loading='lazy'
                    className='aspect-square w-full object-cover'
                  />
                  <span className='block truncate px-2 py-1.5 text-left text-xs text-muted-foreground'>
                    {item.filename}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState
              title='No media yet'
              description='Upload an image to use it in your content.'
            />
          )}
        </div>

        <div className='flex items-center justify-between gap-3 border-t border-border p-4'>
          <Input
            placeholder='Paste an image URL…'
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                const value = (event.target as HTMLInputElement).value.trim();
                if (value) {
                  onSelect(value);
                  onClose();
                }
              }
            }}
          />
          <Button variant='outline' onClick={onClose} disabled={uploading}>
            {uploading ? 'Uploading…' : 'Close'}
          </Button>
        </div>
      </div>
    </div>
  );
};
