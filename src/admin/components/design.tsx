import type { ComponentType, ReactNode } from 'react';
import { Search, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export const SectionCard = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => <div className={cn('surface rounded-2xl', className)}>{children}</div>;

export const SectionHeader = ({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      'flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-5 py-4',
      className,
    )}
  >
    <div>
      <h2 className='text-sm font-semibold text-foreground'>{title}</h2>
      {description && <p className='mt-0.5 text-xs text-muted-foreground'>{description}</p>}
    </div>
    {actions && <div className='flex flex-wrap items-center gap-2'>{actions}</div>}
  </div>
);

export const StatCard = ({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'primary',
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ComponentType<{ className?: string }>;
  tone?: 'primary' | 'violet' | 'success' | 'warning' | 'danger';
}) => {
  const tones: Record<string, string> = {
    primary: 'from-primary/20 text-primary',
    violet: 'from-[color:var(--admin-violet)]/20 text-[color:var(--admin-violet)]',
    success: 'from-[color:var(--admin-success)]/20 text-[color:var(--admin-success)]',
    warning: 'from-[color:var(--admin-warning)]/20 text-[color:var(--admin-warning)]',
    danger: 'from-destructive/20 text-destructive',
  };
  return (
    <SectionCard className='surface-hover p-5'>
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <p className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
            {label}
          </p>
          <p className='mt-2 text-3xl font-semibold tracking-tight text-foreground'>{value}</p>
          {hint && <p className='mt-1 text-xs text-muted-foreground'>{hint}</p>}
        </div>
        {Icon && (
          <span
            className={cn(
              'flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br to-transparent',
              tones[tone],
            )}
          >
            <Icon className='size-5' />
          </span>
        )}
      </div>
    </SectionCard>
  );
};

export const SearchInput = ({
  value,
  onChange,
  placeholder = 'Search…',
  className,
  ariaLabel = 'Search',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  ariaLabel?: string;
}) => (
  <div className={cn('relative', className)}>
    <Search className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
    <input
      type='search'
      value={value}
      aria-label={ariaLabel}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      className='h-10 w-full rounded-xl border border-border bg-[color:var(--muted)]/40 pl-9 pr-9 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40'
    />
    {value && (
      <button
        type='button'
        onClick={() => onChange('')}
        aria-label='Clear search'
        className='absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground'
      >
        <X className='size-3.5' />
      </button>
    )}
  </div>
);

export const FilterSelect = ({
  value,
  onChange,
  options,
  ariaLabel,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  ariaLabel: string;
  className?: string;
}) => (
  <select
    value={value}
    aria-label={ariaLabel}
    onChange={(event) => onChange(event.target.value)}
    className={cn(
      'h-10 rounded-xl border border-border bg-[color:var(--muted)]/40 px-3 text-sm text-foreground transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
      className,
    )}
  >
    {options.map((option) => (
      <option key={option.value} value={option.value} className='bg-[#0f1827]'>
        {option.label}
      </option>
    ))}
  </select>
);

export const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn('skeleton rounded-lg', className)} aria-hidden />
);

export const CardSkeletonGrid = ({ count = 8 }: { count?: number }) => (
  <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4'>
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className='surface overflow-hidden rounded-2xl'>
        <Skeleton className='aspect-square w-full rounded-none' />
        <div className='space-y-2 p-3'>
          <Skeleton className='h-3 w-3/4' />
          <Skeleton className='h-3 w-1/2' />
        </div>
      </div>
    ))}
  </div>
);

export const EmptyStateBlock = ({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: ReactNode;
}) => (
  <div className='flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border px-6 py-16 text-center'>
    {Icon && (
      <span className='flex size-14 items-center justify-center rounded-2xl bg-[color:var(--muted)]/50 text-muted-foreground'>
        <Icon className='size-6' />
      </span>
    )}
    <p className='text-base font-medium text-foreground'>{title}</p>
    {description && <p className='max-w-sm text-sm text-muted-foreground'>{description}</p>}
    {action}
  </div>
);

export const Pagination = ({
  page,
  pageSize,
  total,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}) => {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  return (
    <div className='flex flex-wrap items-center justify-between gap-3 pt-2'>
      <p className='text-xs text-muted-foreground'>
        Showing <span className='text-foreground'>{from}</span>–
        <span className='text-foreground'>{to}</span> of{' '}
        <span className='text-foreground'>{total}</span>
      </p>
      <div className='flex items-center gap-2'>
        <Button
          variant='outline'
          size='sm'
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <span className='px-1 text-xs text-muted-foreground'>
          Page {page} / {pageCount}
        </span>
        <Button
          variant='outline'
          size='sm'
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
};
