import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export const Card = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <div className={cn('rounded-2xl border border-border bg-card p-5 sm:p-6', className)}>
    {children}
  </div>
);

export const PageHeader = ({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) => (
  <div className='mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
    <div>
      <h1 className='text-2xl font-semibold text-foreground'>{title}</h1>
      {description && (
        <p className='mt-1 text-sm text-muted-foreground'>{description}</p>
      )}
    </div>
    {actions && <div className='flex flex-wrap items-center gap-2'>{actions}</div>}
  </div>
);

export const Spinner = ({ className }: { className?: string }) => (
  <span
    role='status'
    aria-label='Loading'
    className={cn(
      'inline-block size-5 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary',
      className,
    )}
  />
);

export const LoadingState = ({ label = 'Loading…' }: { label?: string }) => (
  <div className='flex items-center justify-center gap-3 py-16 text-sm text-muted-foreground'>
    <Spinner />
    {label}
  </div>
);

export const EmptyState = ({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) => (
  <div className='flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center'>
    <p className='text-base font-medium text-foreground'>{title}</p>
    {description && (
      <p className='max-w-sm text-sm text-muted-foreground'>{description}</p>
    )}
    {action}
  </div>
);

export const ErrorBanner = ({ message }: { message: string | null }) => {
  if (!message) return null;
  return (
    <div className='mb-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive'>
      {message}
    </div>
  );
};

export const StatusPill = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    published: 'border-primary/40 bg-primary/10 text-primary',
    draft: 'border-border bg-muted/40 text-muted-foreground',
    unread: 'border-primary/40 bg-primary/10 text-primary',
    read: 'border-border bg-muted/40 text-muted-foreground',
    archived: 'border-border bg-muted/40 text-muted-foreground',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize',
        styles[status] ?? 'border-border bg-muted/40 text-muted-foreground',
      )}
    >
      {status}
    </span>
  );
};

export const Field = ({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) => (
  <label className='grid gap-2'>
    <span className='text-sm font-medium text-foreground'>{label}</span>
    {children}
    {hint && <span className='text-xs text-muted-foreground'>{hint}</span>}
  </label>
);
