import { useRef, useState } from 'react';
import { CloudUpload, FileImage, Trash2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Modal } from '@/admin/components/Modal';
import { Spinner } from '@/admin/components/ui';
import { formatBytes } from '@/admin/components/format';
import { Button } from '@/components/ui/button';
import { uploadMedia } from '@/admin/admin-api';

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const MAX_BYTES = 8 * 1024 * 1024;

type UploadItem = {
  file: File;
  error?: string;
};

export const UploadDialog = ({
  open,
  onClose,
  onUploaded,
}: {
  open: boolean;
  onClose: () => void;
  onUploaded: () => void;
}) => {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setItems([]);
    setError(null);
    setProgress(0);
    setDragging(false);
  };

  const addFiles = (files: FileList | File[]) => {
    const next: UploadItem[] = Array.from(files).map((file) => {
      if (!ACCEPTED.includes(file.type)) {
        return { file, error: 'Unsupported format (JPEG, PNG, WebP, AVIF only)' };
      }
      if (file.size > MAX_BYTES) {
        return { file, error: 'Exceeds the 8MB limit' };
      }
      return { file };
    });
    setItems((current) => [...current, ...next]);
  };

  const validItems = items.filter((item) => !item.error);

  const handleUpload = async () => {
    if (validItems.length === 0) return;
    setUploading(true);
    setError(null);
    setProgress(0);
    try {
      for (let index = 0; index < validItems.length; index += 1) {
        await uploadMedia(validItems[index]!.file);
        setProgress(Math.round(((index + 1) / validItems.length) * 100));
      }
      onUploaded();
      reset();
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (uploading) return;
    reset();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title='Upload images'
      description='Drag & drop or select files. JPEG, PNG, WebP or AVIF, up to 8MB each.'
      footer={
        <>
          <Button variant='ghost' onClick={handleClose} disabled={uploading}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={uploading || validItems.length === 0}>
            {uploading && <Spinner className='size-4 border-white/40 border-t-white' />}
            {uploading ? `Uploading ${progress}%` : `Upload ${validItems.length || ''}`}
          </Button>
        </>
      }
    >
      <div
        role='button'
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click();
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (event.dataTransfer.files.length) addFiles(event.dataTransfer.files);
        }}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors',
          dragging
            ? 'border-primary bg-primary/10'
            : 'border-border hover:border-ring/60 hover:bg-[color:var(--muted)]/30',
        )}
      >
        <span className='accent-gradient flex size-12 items-center justify-center rounded-2xl text-white shadow-lg'>
          <CloudUpload className='size-6' />
        </span>
        <p className='text-sm font-medium text-foreground'>
          Drop files here or click to browse
        </p>
        <p className='text-xs text-muted-foreground'>Multiple files supported</p>
        <input
          ref={inputRef}
          type='file'
          accept={ACCEPTED.join(',')}
          multiple
          hidden
          onChange={(event) => {
            if (event.target.files) addFiles(event.target.files);
            event.target.value = '';
          }}
        />
      </div>

      {items.length > 0 && (
        <ul className='mt-4 space-y-2'>
          {items.map((item, index) => (
            <li
              key={`${item.file.name}-${index}`}
              className='flex items-center gap-3 rounded-xl border border-border/60 px-3 py-2'
            >
              <FileImage className='size-5 shrink-0 text-muted-foreground' />
              <span className='min-w-0 flex-1'>
                <span className='block truncate text-sm text-foreground'>{item.file.name}</span>
                <span
                  className={cn(
                    'block text-xs',
                    item.error ? 'text-destructive' : 'text-muted-foreground',
                  )}
                >
                  {item.error ?? formatBytes(item.file.size)}
                </span>
              </span>
              <button
                type='button'
                disabled={uploading}
                onClick={() => setItems((current) => current.filter((_, i) => i !== index))}
                aria-label={`Remove ${item.file.name}`}
                className='rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive disabled:opacity-50'
              >
                <Trash2 className='size-4' />
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p className='mt-4 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive'>
          {error}
        </p>
      )}
    </Modal>
  );
};
