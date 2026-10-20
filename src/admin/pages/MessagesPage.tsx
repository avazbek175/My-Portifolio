import { useEffect, useMemo, useState } from 'react';
import { Archive, Eye, Inbox, Mail, MailOpen, Search as SearchIcon, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  EmptyStateBlock,
  FilterSelect,
  Pagination,
  SearchInput,
  SectionCard,
  Skeleton,
  StatCard,
} from '@/admin/components/design';
import { formatRelative } from '@/admin/components/format';
import { ErrorBanner, PageHeader, StatusPill } from '@/admin/components/ui';
import { Modal } from '@/admin/components/Modal';
import { ConfirmDialog } from '@/admin/components/ConfirmDialog';
import { useToast } from '@/admin/components/toast-context';
import { cn } from '@/lib/utils';
import { deleteMessage, listMessages, setMessageStatus } from '@/admin/admin-api';
import { useAsync } from '@/admin/hooks/useAsync';
import type { Message, MessageStatus } from '@/lib/cms-types';

type StatusFilter = 'all' | 'unread' | 'read' | 'archived';

export const MessagesPage = () => {
  const toast = useToast();
  const [status, setStatus] = useState<StatusFilter>('all');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Message | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Message | null>(null);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(handle);
  }, [searchInput]);

  const { data, loading, error, reload } = useAsync(
    () =>
      listMessages({
        status: status === 'all' ? undefined : (status as MessageStatus),
        search: search || undefined,
        page,
        pageSize: 20,
      }),
    [status, search, page],
  );

  const stats = useMemo(() => {
    const items = data?.items ?? [];
    return {
      total: data?.total ?? 0,
      unread: items.filter((message) => message.status === 'unread').length,
      archived: items.filter((message) => message.status === 'archived').length,
    };
  }, [data]);

  const act = async (id: string, fn: () => Promise<unknown>, successMessage?: string) => {
    setBusy(id);
    try {
      await fn();
      if (successMessage) toast.success(successMessage);
      reload();
    } catch (cause) {
      toast.error('Action failed', cause instanceof Error ? cause.message : undefined);
    } finally {
      setBusy(null);
    }
  };

  const openMessage = (message: Message) => {
    setSelected(message);
    if (message.status === 'unread') {
      void act(message.id, () => setMessageStatus(message.id, 'read')).then(() =>
        setSelected((current) => (current ? { ...current, status: 'read' } : current)),
      );
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setBusy(pendingDelete.id);
    try {
      await deleteMessage(pendingDelete.id);
      toast.success('Message deleted');
      setPendingDelete(null);
      setSelected(null);
      if (data && data.items.length === 1 && page > 1) setPage((value) => value - 1);
      else reload();
    } catch (cause) {
      toast.error('Could not delete message', cause instanceof Error ? cause.message : undefined);
    } finally {
      setBusy(null);
    }
  };

  const showEmpty = !loading && data && data.items.length === 0;

  return (
    <div className='space-y-6'>
      <PageHeader title='Messages' description='Contact form submissions from your visitors.' />

      <div className='grid gap-4 sm:grid-cols-3'>
        <StatCard label='Total messages' value={stats.total} icon={Mail} tone='primary' />
        <StatCard
          label='Unread (page)'
          value={stats.unread}
          icon={MailOpen}
          tone={stats.unread > 0 ? 'warning' : 'success'}
        />
        <StatCard label='Archived (page)' value={stats.archived} icon={Archive} tone='violet' />
      </div>

      <SectionCard>
        <div className='flex flex-col gap-3 border-b border-border/60 p-4 sm:flex-row sm:items-center'>
          <SearchInput
            value={searchInput}
            onChange={setSearchInput}
            placeholder='Search sender, subject…'
            className='sm:max-w-xs'
          />
          <div className='sm:ml-auto'>
            <FilterSelect
              ariaLabel='Filter by status'
              value={status}
              onChange={(value) => {
                setStatus(value as StatusFilter);
                setPage(1);
              }}
              options={[
                { value: 'all', label: 'All messages' },
                { value: 'unread', label: 'Unread' },
                { value: 'read', label: 'Read' },
                { value: 'archived', label: 'Archived' },
              ]}
            />
          </div>
        </div>

        <div className='p-4'>
          <ErrorBanner message={error} />

          {loading && !data ? (
            <div className='space-y-2'>
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className='h-16 rounded-xl' />
              ))}
            </div>
          ) : showEmpty ? (
            <EmptyStateBlock
              icon={search ? SearchIcon : Inbox}
              title={search ? 'No messages match your search' : 'No messages'}
              description={
                search
                  ? 'Try a different search term or clear the filters.'
                  : 'Messages from the public contact form will appear here.'
              }
            />
          ) : (
            <ul className='space-y-2'>
              {data?.items.map((message) => (
                <li
                  key={message.id}
                  className={cn(
                    'surface-hover flex flex-wrap items-center gap-3 rounded-xl border p-3 sm:flex-nowrap',
                    message.status === 'unread'
                      ? 'border-primary/40 bg-primary/5'
                      : 'border-border/60',
                  )}
                >
                  <button
                    type='button'
                    onClick={() => openMessage(message)}
                    className='min-w-0 flex-1 text-left focus-visible:outline-none'
                  >
                    <span className='flex items-center gap-2'>
                      {message.status === 'unread' && (
                        <span className='size-2 shrink-0 rounded-full bg-primary' aria-label='Unread' />
                      )}
                      <span className='truncate text-sm font-medium text-foreground'>
                        {message.subject}
                      </span>
                    </span>
                    <span className='mt-0.5 block truncate text-xs text-muted-foreground'>
                      {message.name} · {message.email} · {formatRelative(message.createdAt)}
                    </span>
                  </button>

                  <div className='flex items-center gap-2'>
                    <StatusPill status={message.status} />
                    <Button
                      variant='ghost'
                      size='icon-sm'
                      title='View'
                      aria-label='View message'
                      onClick={() => openMessage(message)}
                    >
                      <Eye className='size-4' />
                    </Button>
                    <Button
                      variant='ghost'
                      size='sm'
                      disabled={busy === message.id}
                      onClick={() =>
                        act(
                          message.id,
                          () =>
                            setMessageStatus(
                              message.id,
                              message.status === 'unread' ? 'read' : 'unread',
                            ),
                          message.status === 'unread' ? 'Marked as read' : 'Marked as unread',
                        )
                      }
                    >
                      {message.status === 'unread' ? 'Mark read' : 'Mark unread'}
                    </Button>
                    <Button
                      variant='ghost'
                      size='icon-sm'
                      title='Archive'
                      aria-label='Archive message'
                      disabled={busy === message.id || message.status === 'archived'}
                      onClick={() =>
                        act(message.id, () => setMessageStatus(message.id, 'archived'), 'Archived')
                      }
                    >
                      <Archive className='size-4' />
                    </Button>
                    <Button
                      variant='ghost'
                      size='icon-sm'
                      title='Delete'
                      aria-label='Delete message'
                      disabled={busy === message.id}
                      onClick={() => setPendingDelete(message)}
                    >
                      <Trash2 className='size-4 text-destructive' />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {data && (
            <Pagination
              page={data.page}
              pageSize={data.pageSize}
              total={data.total}
              onPageChange={setPage}
            />
          )}
        </div>
      </SectionCard>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.subject}
        description={
          selected
            ? `${selected.name} · ${selected.email} · ${new Date(selected.createdAt).toLocaleString()}`
            : undefined
        }
        className='sm:max-w-2xl'
        footer={
          selected && (
            <>
              <Button
                variant='outline'
                size='sm'
                disabled={busy === selected.id}
                onClick={() =>
                  act(
                    selected.id,
                    () =>
                      setMessageStatus(
                        selected.id,
                        selected.status === 'unread' ? 'read' : 'unread',
                      ),
                  ).then(() =>
                    setSelected((current) =>
                      current
                        ? { ...current, status: current.status === 'unread' ? 'read' : 'unread' }
                        : current,
                    ),
                  )
                }
              >
                {selected.status === 'unread' ? 'Mark read' : 'Mark unread'}
              </Button>
              <Button
                variant='outline'
                size='sm'
                disabled={busy === selected.id}
                onClick={() =>
                  act(selected.id, () => setMessageStatus(selected.id, 'archived'), 'Archived').then(
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
                onClick={() => setPendingDelete(selected)}
              >
                Delete
              </Button>
            </>
          )
        }
      >
        <p className='whitespace-pre-wrap text-sm leading-relaxed text-foreground'>
          {selected?.body}
        </p>
        <a
          href={selected ? `mailto:${selected.email}?subject=${encodeURIComponent(`Re: ${selected.subject}`)}` : '#'}
          className='mt-4 inline-block text-sm text-primary hover:underline'
        >
          Reply by email
        </a>
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDelete}
        destructive
        confirmLabel='Delete message'
        title='Delete this message?'
        description={
          pendingDelete
            ? `The message from ${pendingDelete.name} will be permanently removed.`
            : undefined
        }
      />
    </div>
  );
};
