import { useState } from 'react';
import { RefreshCw, Shield } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  EmptyStateBlock,
  FilterSelect,
  SectionCard,
  SectionHeader,
  Skeleton,
} from '@/admin/components/design';
import { formatRelative } from '@/admin/components/format';
import { ErrorBanner, PageHeader } from '@/admin/components/ui';
import { listAudit } from '@/admin/admin-api';
import { useAsync } from '@/admin/hooks/useAsync';

const limitOptions = [25, 50, 100, 200].map((value) => ({
  value: String(value),
  label: `Last ${value}`,
}));

export const AuditPage = () => {
  const [limit, setLimit] = useState(50);
  const { data, loading, error, reload } = useAsync(() => listAudit(limit), [limit]);

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Audit Log'
        description='Recent admin actions tracked by the system.'
        actions={
          <div className='flex items-center gap-2'>
            <FilterSelect
              ariaLabel='Number of entries'
              value={String(limit)}
              onChange={(value) => setLimit(Number(value))}
              options={limitOptions}
            />
            <Button variant='outline' size='sm' onClick={() => reload()}>
              <RefreshCw className='size-4' />
              Refresh
            </Button>
          </div>
        }
      />

      <ErrorBanner message={error} />

      <SectionCard>
        <SectionHeader
          title='Activity'
          description={`Showing the most recent ${limit} entries`}
        />
        <div className='overflow-x-auto'>
          {loading && !data ? (
            <div className='space-y-2 p-4'>
              {Array.from({ length: 8 }).map((_, index) => (
                <Skeleton key={index} className='h-10 rounded-lg' />
              ))}
            </div>
          ) : data && data.items.length === 0 ? (
            <div className='p-4'>
              <EmptyStateBlock
                icon={Shield}
                title='No audit entries yet'
                description='Admin actions will be recorded here as you use the panel.'
              />
            </div>
          ) : (
            <table className='w-full text-sm'>
              <thead className='bg-[color:var(--muted)]/30 text-left text-xs uppercase tracking-wide text-muted-foreground'>
                <tr>
                  <th className='px-4 py-3 font-medium'>When</th>
                  <th className='px-4 py-3 font-medium'>Admin</th>
                  <th className='px-4 py-3 font-medium'>Action</th>
                  <th className='px-4 py-3 font-medium'>Entity</th>
                  <th className='px-4 py-3 font-medium'>IP</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-border/60'>
                {data?.items.map((entry) => (
                  <tr key={entry.id} className='transition-colors hover:bg-[color:var(--accent)]/30'>
                    <td className='whitespace-nowrap px-4 py-2.5 text-xs text-muted-foreground'>
                      {formatRelative(entry.created_at)}
                    </td>
                    <td className='px-4 py-2.5 text-sm text-foreground'>
                      {entry.admin_email ?? '—'}
                    </td>
                    <td className='px-4 py-2.5'>
                      <span className='rounded-md bg-[color:var(--muted)]/50 px-2 py-0.5 font-mono text-xs text-foreground'>
                        {entry.action}
                      </span>
                    </td>
                    <td className='px-4 py-2.5 text-xs text-muted-foreground'>
                      {entry.entity_type ?? '—'}
                      {entry.entity_id ? `:${entry.entity_id.slice(0, 8)}` : ''}
                    </td>
                    <td className='px-4 py-2.5 text-xs text-muted-foreground'>{entry.ip ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </SectionCard>
    </div>
  );
};
