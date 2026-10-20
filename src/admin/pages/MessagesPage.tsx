import { useState } from 'react';
import { Eye, Inbox, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {

  EmptyState,
  ErrorBanner,
  LoadingState,
  PageHeader,
  StatusPill,
} from '@/admin/components/ui';
import { cn } from '@/lib/utils';
import { deleteMessage, listMessages, setMessageStatus } from '@/admin/admin-api';
import { useAsync } from '@/admin/hooks/useAsync';
import type { Message, MessageStatus } from '@/lib/cms-types';

type StatusFilter = 'all' | 'unread' | 'read' | 'archived';

const filters: StatusFilter[] = ['all', 'unread', 'read', 'archived'];

export const MessagesPage = () => {
  const [status, setStatus] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Message | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data, loading, reload } = useAsync(
    () =>
      listMessages({
        status: status === 'all' ? undefined : (status as MessageStatus),
        page,
        pageSize: 20,
      }),
    [status, page],
  );

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  const act = async (id: string, fn: () => Promise<unknown>) => {
    setBusy(id);
    setError(null);
    try {
      await fn();
      reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Action failed');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <PageHeader title='Messages' description='Contact form submissions.' />

      <div className='mb-5 flex gap-1 rounded-lg border border-border p-1'>
        {filters.map((filter) => (
          <button
            key={filter}
            type='button'
            onClick={() => {
              setStatus(filter);
              setPage(1);
            }}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm capitalize transition-colors',
              status === filter
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {filter}
          </button>
        ))}
      </div>

      <ErrorBanner message={error} />

      {loading && !data ? (
        <LoadingState />
      ) : data && data.items.length > 0 ? (
        <div className='overflow-hidden rounded-2xl border border-border'>
          <table className='w-full text-sm'>
            <thead className='bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground'>
              <tr>
                <th className='px-4 py-3 font-medium'>Sender</th>
                <th className='hidden px-4 py-3 font-medium md:table-cell'>Subject</th>
                <th className='px-4 py-3 font-medium'>Status</th>
                <th className='px-4 py-3 font-medium'>Received</th>
                <th className='px-4 py-3 text-right font-medium'>Actions</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-border'>
              {data.items.map((message) => (
                <tr key={message.id} className='bg-card'>
                  <td className='px-4 py-3'>
                    <div className='font-medium text-foreground'>{message.name}</div>
                    <div className='text-xs text-muted-foreground'>{message.email}</div>
                  </td>
                  <td className='hidden px-4 py-3 text-muted-foreground md:table-cell'>
                    {message.subject}
                  </td>
                  <td className='px-4 py-3'>
                    <StatusPill status={message.status} />
                  </td>
                  <td className='px-4 py-3 text-muted-foreground'>
                    {new Date(message.createdAt).toLocaleDateString()}
                  </td>
                  <td className='px-4 py-3'>
                    <div className='flex items-center justify-end gap-1'>
                      <Button
                        variant='ghost'
                        size='icon-sm'
                        title='View'
                        onClick={() => setSelected(message)}
                      >
                        <Eye />
                      </Button>
                      <Button
                        variant='ghost'
                        size='sm'
                        disabled={busy === message.id}
                        onClick={() =>
                          act(message.id, () =>
                            setMessageStatus(
                              message.id,
                              message.status === 'unread' ? 'read' : 'unread',
                            ),
                          )
                        }
                      >
                        {message.status === 'unread' ? 'Mark read' : 'Mark unread'}
                      </Button>
                      <Button
                        variant='ghost'
                        size='icon-sm'
                        title='Archive'
                        disabled={busy === message.id}
                        onClick={() =>
                          act(message.id, () =>
                            setMessageStatus(message.id, 'archived'),
                          )
                        }
                      >
                        <Inbox />
                      </Button>
                      <Button
                        variant='ghost'
                        size='icon-sm'
                        title='Delete'
                        disabled={busy === message.id}
                        onClick={() =>
                          act(message.id, () => deleteMessage(message.id))
                        }
                      >
                        <Trash2 className='text-destructive' />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title='No messages'
          description='Messages from the public contact form will appear here.'
        />
      )}

      {data && data.total > data.pageSize && (
        <div className='mt-4 flex items-center justify-between text-sm text-muted-foreground'>
          <span>
            Page {data.page} of {totalPages} · {data.total} total
          </span>
          <div className='flex gap-2'>
            <Button
              variant='outline'
              size='sm'
              disabled={page <= 1}
              onClick={() => setPage((v) => Math.max(1, v - 1))}
            >
              Previous
            </Button>
            <Button
              variant='outline'
              size='sm'
              disabled={page >= totalPages}
              onClick={() => setPage((v) => v + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {selected && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm'
          onClick={() => setSelected(null)}
        >
          <div
            className='w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-card'
            onClick={(e) => e.stopPropagation()}
          >
            <div className='flex items-center justify-between border-b border-border px-5 py-3'>
              <div>
                <p className='text-sm font-medium text-foreground'>{selected.subject}</p>
                <p className='text-xs text-muted-foreground'>
                  {selected.name} · {selected.email} ·{' '}
                  {new Date(selected.createdAt).toLocaleString()}
                </p>
              </div>
              <Button variant='ghost' size='icon-sm' onClick={() => setSelected(null)}>
                ×
              </Button>
            </div>
            <div className='max-h-[70vh] overflow-y-auto p-5'>
              <pre className='whitespace-pre-wrap text-sm text-foreground'>
                {selected.body}
              </pre>
            </div>
            <div className='flex items-center justify-end gap-2 border-t border-border p-4'>
              <Button
                variant='outline'
                size='sm'
                disabled={busy === selected.id}
                onClick={() =>
                  act(selected.id, () =>
                    setMessageStatus(
                      selected.id,
                      selected.status === 'unread' ? 'read' : 'unread',
                    ),
                  ).then(() => setSelected({ ...selected, status: selected.status === 'unread' ? 'read' : 'unread' } as Message))
                }
              >
                {selected.status === 'unread' ? 'Mark read' : 'Mark unread'}
              </Button>
              <Button
                variant='outline'
                size='sm'
                disabled={busy === selected.id}
                onClick={() =>
                  act(selected.id, () => setMessageStatus(selected.id, 'archived')).then(
                    () => setSelected(null),
                  )
                }
              >
                Archive
              </Button>
              <Button
                variant='destructive'
                size='sm'
                disabled={busy === selected.id}
                onClick={() =>
                  act(selected.id, () => deleteMessage(selected.id)).then(() =>
                    setSelected(null),
                  )
                }
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
