import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  ToastContext,
  type ToastContextValue,
  type ToastInput,
  type ToastVariant,
} from '@/admin/components/toast-context';

type Toast = {
  id: number;
  title: string;
  description?: string;
  variant: ToastVariant;
};

const variantStyles: Record<ToastVariant, string> = {
  success: 'border-[color:var(--admin-success)]/40 text-[color:var(--admin-success)]',
  error: 'border-destructive/40 text-destructive',
  info: 'border-primary/40 text-primary',
};

const VariantIcon = ({ variant }: { variant: ToastVariant }) => {
  if (variant === 'success') return <CheckCircle2 className='size-5' />;
  if (variant === 'error') return <XCircle className='size-5' />;
  return <Info className='size-5' />;
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toastItem) => toastItem.id !== id));
  }, []);

  const toast = useCallback(
    ({ title, description, variant = 'info' }: ToastInput) => {
      counter.current += 1;
      const id = counter.current;
      setToasts((current) => [...current, { id, title, description, variant }]);
      window.setTimeout(() => dismiss(id), 4500);
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      toast,
      success: (title, description) => toast({ title, description, variant: 'success' }),
      error: (title, description) => toast({ title, description, variant: 'error' }),
      info: (title, description) => toast({ title, description, variant: 'info' }),
    }),
    [toast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className='pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-0 sm:items-end'
        role='region'
        aria-label='Notifications'
      >
        {toasts.map((toastItem) => (
          <div
            key={toastItem.id}
            role='status'
            className={cn(
              'surface pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl px-4 py-3 shadow-2xl',
              'animate-in slide-in-from-bottom-2 fade-in-0 duration-200',
            )}
          >
            <span className={cn('mt-0.5 shrink-0', variantStyles[toastItem.variant])}>
              <VariantIcon variant={toastItem.variant} />
            </span>
            <div className='min-w-0 flex-1'>
              <p className='text-sm font-medium text-foreground'>{toastItem.title}</p>
              {toastItem.description && (
                <p className='mt-0.5 text-xs text-muted-foreground'>
                  {toastItem.description}
                </p>
              )}
            </div>
            <button
              type='button'
              onClick={() => dismiss(toastItem.id)}
              aria-label='Dismiss notification'
              className='shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
            >
              <X className='size-4' />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
