import { useRef, useState } from 'react';
import { Image as ImageIcon, Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CardSkeletonGrid, EmptyStateBlock, SearchInput } from '@/admin/components/design';
import { Modal } from '@/admin/components/Modal';
import { ErrorBanner } from '@/admin/components/ui';
import { listMedia, uploadMedia } from '@/admin/admin-api';
import { useAsync } from '@/admin/hooks/useAsync';

type MediaPickerProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
};

export const MediaPicker = ({ open, onClose, onSelect }: MediaPickerProps) => {
  const [nonce, setNonce] = useState(0);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data, loading } = useAsync(
    () => (open ? listMedia({ pageSize: 60, search: search || undefined }) : Promise.resolve(null)),
    [open, nonce, search],
  );

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
    <Modal
      open={open}
      onClose={onClose}
      title='Media library'
      description='Pick an existing image or upload a new one.'
      className='sm:max-w-3xl'
      footer={
        <>
          <Input
            placeholder='Paste an image URL and press Enter…'
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
            Close
          </Button>
        </>
      }
    >
      <div className='mb-4 flex items-center gap-2'>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder='Search images…'
          className='flex-1'
        />
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
          <Upload className='size-4' />
          {uploading ? 'Uploading…' : 'Upload'}
        </Button>
      </div>

      <ErrorBanner message={error} />

      {loading && !data ? (
        <CardSkeletonGrid count={8} />
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
              className='group overflow-hidden rounded-xl border border-border/60 transition-colors hover:border-ring/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50'
            >
              <img
                src={item.url}
                alt={item.filename}
                loading='lazy'
                className='aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105'
              />
              <span className='block truncate px-2 py-1.5 text-left text-xs text-muted-foreground'>
                {item.filename}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <EmptyStateBlock
          icon={ImageIcon}
          title='No media yet'
          description='Upload an image to use it in your content.'
        />
      )}
    </Modal>
  );
};
