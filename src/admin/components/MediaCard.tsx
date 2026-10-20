import { useState } from 'react';
import { Check, Copy, Download, ImageOff, Trash2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import { formatBytes, formatRelative } from '@/admin/components/format';
import type { MediaItem } from '@/lib/cms-types';

export const MediaCard = ({
  item,
  view,
  busy,
  onDelete,
}: {
  item: MediaItem;
  view: 'grid' | 'list';
  busy?: boolean;
  onDelete: (item: MediaItem) => void;
}) => {
  const [copied, setCopied] = useState(false);

  const copyUrl = async () => {
    try {
      const absolute = new URL(item.url, window.location.origin).href;
      await navigator.clipboard.writeText(absolute);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const actions = (
    <div className='flex items-center gap-1'>
      <button
        type='button'
        onClick={copyUrl}
        aria-label={`Copy URL for ${item.filename}`}
        className='rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50'
      >
        {copied ? <Check className='size-4 text-[color:var(--admin-success)]' /> : <Copy className='size-4' />}
      </button>
      <a
        href={item.url}
        target='_blank'
        rel='noopener noreferrer'
        aria-label={`Open ${item.filename} in a new tab`}
        className='rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50'
      >
        <Download className='size-4' />
      </a>
      <button
        type='button'
        disabled={busy}
        onClick={() => onDelete(item)}
        aria-label={`Delete ${item.filename}`}
        className='rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-50'
      >
        <Trash2 className='size-4' />
      </button>
    </div>
  );

  if (view === 'list') {
    return (
      <div className='surface surface-hover flex items-center gap-3 rounded-xl p-2.5'>
        <div className='relative size-14 shrink-0 overflow-hidden rounded-lg bg-[color:var(--muted)]/50'>
          {item.url ? (
            <img
              src={item.url}
              alt={item.filename}
              loading='lazy'
              className='size-full object-cover'
            />
          ) : (
            <span className='flex size-full items-center justify-center text-muted-foreground'>
              <ImageOff className='size-5' />
            </span>
          )}
        </div>
        <div className='min-w-0 flex-1'>
          <p className='truncate text-sm font-medium text-foreground'>{item.filename}</p>
          <p className='truncate text-xs text-muted-foreground'>
            {item.width && item.height ? `${item.width}×${item.height} · ` : ''}
            {formatBytes(item.sizeBytes)} · {formatRelative(item.createdAt)}
          </p>
        </div>
        {actions}
      </div>
    );
  }

  return (
    <div className='surface surface-hover group relative overflow-hidden rounded-2xl'>
      <div className='relative aspect-square w-full overflow-hidden bg-[color:var(--muted)]/40'>
        {item.url ? (
          <img
            src={item.url}
            alt={item.filename}
            loading='lazy'
            className='size-full object-cover transition-transform duration-300 group-hover:scale-105'
          />
        ) : (
          <span className='flex size-full items-center justify-center text-muted-foreground'>
            <ImageOff className='size-6' />
          </span>
        )}
        <div className='absolute inset-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/80 via-black/10 to-transparent p-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-within:opacity-100'>
          {actions}
        </div>
        {item.format && (
          <span className='absolute left-2 top-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur'>
            {item.format}
          </span>
        )}
      </div>
      <div className='space-y-0.5 p-2.5'>
        <p className='truncate text-xs font-medium text-foreground'>{item.filename}</p>
        <p
          className={cn(
            'truncate text-[11px] text-muted-foreground',
            busy && 'opacity-60',
          )}
        >
          {formatBytes(item.sizeBytes)} · {formatRelative(item.createdAt)}
        </p>
      </div>
    </div>
  );
};
