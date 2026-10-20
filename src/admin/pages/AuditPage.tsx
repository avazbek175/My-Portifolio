import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, ErrorBanner, LoadingState, PageHeader } from '@/admin/components/ui';
import { listAudit } from '@/admin/admin-api';
import { useAsync } from '@/admin/hooks/useAsync';

export const AuditPage = () => {
  const [limit, setLimit] = useState(50);
  const { data, loading, error, reload } = useAsync(() => listAudit(limit), [limit]);

  return (
    <div>
      <PageHeader
        title='Audit log'
        description='Recent admin actions tracked by the system.'
        actions={
          <div className='flex items-center gap-2'>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className='h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground'
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>
            <Button variant='outline' size='sm' onClick={() => reload()}>
              Refresh
            </Button>
          </div>
        }
      />

      <ErrorBanner message={error} />

      {loading && !data ? (
        <LoadingState />
      ) : data ? (
        <Card className='overflow-hidden p-0'>
          <table className='w-full text-sm'>
            <thead className='bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground'>
              <tr>
                <th className='px-4 py-3 font-medium'>When</th>
                <th className='px-4 py-3 font-medium'>Admin</th>
                <th className='px-4 py-3 font-medium'>Action</th>
                <th className='px-4 py-3 font-medium'>Entity</th>
                <th className='px-4 py-3 font-medium'>IP</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-border'>
              {data.items.length === 0 ? (
                <tr>
                  <td colSpan={5} className='px-4 py-8 text-center text-sm text-muted-foreground'>
                    No audit entries yet.
                  </td>
                </tr>
              ) : (
                data.items.map((entry) => (
                  <tr key={entry.id} className='bg-card'>
                    <td className='px-4 py-2 text-xs text-muted-foreground'>
                      {new Date(entry.created_at).toLocaleString()}
                    </td>
                    <td className='px-4 py-2'>{entry.admin_email ?? '-'}</td>
                    <td className='px-4 py-2 font-mono text-xs'>{entry.action}</td>
                    <td className='px-4 py-2 text-xs text-muted-foreground'>
                      {entry.entity_type}
                      {entry.entity_id ? `:${entry.entity_id}` : ''}
                    </td>
                    <td className='px-4 py-2 text-xs text-muted-foreground'>{entry.ip ?? '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      ) : null}
    </div>
  );
};
