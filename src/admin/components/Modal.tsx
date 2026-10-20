import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

import { cn } from '@/lib/utils';

export const Modal = ({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
}) => {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className='admin-shell fixed inset-0 z-[90] flex items-end justify-center sm:items-center'>
      <div
        className='absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in-0 duration-150'
        onClick={onClose}
        aria-hidden
      />
      <div
        role='dialog'
        aria-modal='true'
        aria-label={title}
        className={cn(
          'surface relative z-10 flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-2xl sm:max-w-lg sm:rounded-2xl',
          'animate-in slide-in-from-bottom-4 fade-in-0 duration-200 sm:zoom-in-95',
          className,
        )}
      >
        {(title || description) && (
          <div className='flex items-start justify-between gap-4 border-b border-border/60 px-5 py-4'>
            <div>
              {title && <h2 className='text-lg font-semibold text-foreground'>{title}</h2>}
              {description && (
                <p className='mt-1 text-sm text-muted-foreground'>{description}</p>
              )}
            </div>
            <button
              type='button'
              onClick={onClose}
              aria-label='Close dialog'
              className='rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
            >
              <X className='size-4' />
            </button>
          </div>
        )}
        <div className='min-h-0 flex-1 overflow-y-auto px-5 py-4'>{children}</div>
        {footer && (
          <div className='flex flex-wrap items-center justify-end gap-2 border-t border-border/60 px-5 py-4'>
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};
