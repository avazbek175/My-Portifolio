import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FileText, Plus, Save, Trash2, Wrench } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ErrorBanner, Field, LoadingState, Spinner } from '@/admin/components/ui';
import {
  EmptyStateBlock,
  SectionCard,
  SectionHeader,
  Skeleton,
} from '@/admin/components/design';
import { ConfirmDialog } from '@/admin/components/ConfirmDialog';
import { useToast } from '@/admin/components/toast-context';
import { contentApi, getSettings, listPages, updatePage, updateSetting } from '@/admin/admin-api';
import { useAsync } from '@/admin/hooks/useAsync';
import { cn } from '@/lib/utils';
import type { Page } from '@/lib/cms-types';

type TabKey = 'pages' | 'skills' | 'experiences' | 'services' | 'nav';

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: 'pages', label: 'Pages & Settings' },
  { key: 'skills', label: 'Skills' },
  { key: 'experiences', label: 'Experience' },
  { key: 'services', label: 'Services' },
  { key: 'nav', label: 'Navigation' },
];

const isTabKey = (value: string | null): value is TabKey =>
  tabs.some((tab) => tab.key === value);

export const ContentPage = () => {
  const [params, setParams] = useSearchParams();
  const requested = params.get('tab');
  const active: TabKey = isTabKey(requested) ? requested : 'pages';

  const setActive = (tab: TabKey) => {
    const next = new URLSearchParams(params);
    next.set('tab', tab);
    setParams(next, { replace: true });
  };

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-1'>
        <h1 className='text-2xl font-semibold tracking-tight text-foreground'>Content</h1>
        <p className='text-sm text-muted-foreground'>
          Manage pages, settings, skills, experience, services and navigation.
        </p>
      </div>

      <div className='flex flex-wrap gap-1.5 rounded-2xl border border-border bg-[color:var(--muted)]/30 p-1.5'>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type='button'
            onClick={() => setActive(tab.key)}
            className={cn(
              'rounded-xl px-3.5 py-2 text-sm font-medium transition-colors',
              active === tab.key
                ? 'accent-gradient text-white shadow-lg'
                : 'text-muted-foreground hover:bg-[color:var(--accent)] hover:text-foreground',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {active === 'pages' && <PagesTab />}
      {active === 'skills' && <SkillsTab />}
      {active === 'experiences' && <ExperiencesTab />}
      {active === 'services' && <ServicesTab />}
      {active === 'nav' && <NavTab />}
    </div>
  );
};

const Row = ({
  children,
  onDelete,
  busy,
}: {
  children: React.ReactNode;
  onDelete: () => void;
  busy?: boolean;
}) => (
  <div className='flex items-center justify-between gap-3 rounded-xl border border-border/60 px-3 py-2.5 text-sm transition-colors hover:bg-[color:var(--accent)]/30'>
    <div className='min-w-0'>{children}</div>
    <Button
      variant='ghost'
      size='icon-sm'
      onClick={onDelete}
      disabled={busy}
      aria-label='Delete'
    >
      <Trash2 className='size-4 text-destructive' />
    </Button>
  </div>
);

/* --------------------------------- Pages tab ------------------------------ */

const PagesTab = () => {
  const toast = useToast();
  const pages = useAsync(() => listPages(), []);
  const settings = useAsync(() => getSettings(), []);
  const [editing, setEditing] = useState<Page | null>(null);

  if (pages.loading && !pages.data) {
    return (
      <div className='grid gap-5 lg:grid-cols-2'>
        <Skeleton className='h-64 rounded-2xl' />
        <Skeleton className='h-64 rounded-2xl' />
      </div>
    );
  }

  return (
    <div className='grid gap-5'>
      <ErrorBanner message={pages.error ?? settings.error} />

      <SectionCard>
        <SectionHeader title='Pages' description='Edit structured content for each page.' />
        <div className='grid gap-3 p-5 sm:grid-cols-3'>
          {pages.data?.items.map((page) => (
            <button
              key={page.id}
              type='button'
              onClick={() => setEditing(page)}
              className='surface-hover flex flex-col gap-2 rounded-xl border border-border/60 p-4 text-left'
            >
              <span className='flex items-center gap-2 text-sm font-medium text-foreground'>
                <FileText className='size-4 text-primary' />
                {page.title ?? page.id}
              </span>
              <span className='text-xs text-muted-foreground'>
                {Object.keys(page.content ?? {}).length} fields · updated{' '}
                {new Date(page.updatedAt).toLocaleDateString()}
              </span>
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard>
        <SectionHeader title='Site settings' description='Global configuration groups.' />
        <div className='grid gap-5 p-5'>
          {settings.loading && !settings.data ? (
            <LoadingState />
          ) : (
            Object.entries(settings.data ?? {}).map(([key, value]) => (
              <SettingsGroup
                key={key}
                name={key}
                value={value}
                onSaved={() => {
                  settings.reload();
                  toast.success('Settings saved', key);
                }}
              />
            ))
          )}
        </div>
      </SectionCard>

      {editing && (
        <PageEditor
          page={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            pages.reload();
            setEditing(null);
            toast.success('Page saved', editing.id);
          }}
        />
      )}
    </div>
  );
};

const PageEditor = ({
  page,
  onClose,
  onSaved,
}: {
  page: Page;
  onClose: () => void;
  onSaved: () => void;
}) => {
  const [title, setTitle] = useState(page.title ?? '');
  const [seoTitle, setSeoTitle] = useState(page.seoTitle ?? '');
  const [seoDescription, setSeoDescription] = useState(page.seoDescription ?? '');
  const [content, setContent] = useState(JSON.stringify(page.content ?? {}, null, 2));
  const [contentError, setContentError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(content) as Record<string, unknown>;
    } catch {
      setContentError('Invalid JSON');
      return;
    }
    setContentError(null);
    setError(null);
    try {
      await updatePage(page.id, {
        title: title || null,
        content: parsed,
        seoTitle: seoTitle || null,
        seoDescription: seoDescription || null,
      });
      onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Failed to save page');
    }
  };

  return (
    <ConfirmDialog
      open
      onClose={onClose}
      onConfirm={save}
      confirmLabel='Save page'
      title={`Edit ${page.id}`}
      cancelLabel='Cancel'
    >
      <div className='grid gap-4'>
        <ErrorBanner message={error} />
        <Field label='Page title'>
          <Input value={title} onChange={(event) => setTitle(event.target.value)} />
        </Field>
        <Field label='SEO title'>
          <Input value={seoTitle} onChange={(event) => setSeoTitle(event.target.value)} />
        </Field>
        <Field label='SEO description'>
          <Textarea
            rows={2}
            value={seoDescription}
            onChange={(event) => setSeoDescription(event.target.value)}
          />
        </Field>
        <Field label='Content (JSON)' hint={contentError ?? 'Structured page content.'}>
          <Textarea
            rows={12}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            className={cn('font-mono text-xs', contentError && 'border-destructive')}
          />
        </Field>
      </div>
    </ConfirmDialog>
  );
};

const SettingsGroup = ({
  name,
  value,
  onSaved,
}: {
  name: string;
  value: Record<string, unknown>;
  onSaved: () => void;
}) => {
  const [draft, setDraft] = useState(JSON.stringify(value ?? {}, null, 2));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(draft) as Record<string, unknown>;
    } catch {
      setError('Invalid JSON');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateSetting(name, parsed);
      onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className='grid gap-2'>
      <div className='flex items-center justify-between'>
        <span className='text-sm font-medium capitalize text-foreground'>{name}</span>
        <Button variant='outline' size='sm' onClick={save} disabled={saving}>
          {saving ? <Spinner className='size-4' /> : <Save className='size-4' />}
          Save
        </Button>
      </div>
      {error && <p className='text-xs text-destructive'>{error}</p>}
      <Textarea
        rows={5}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        className={cn('font-mono text-xs', error && 'border-destructive')}
      />
    </div>
  );
};

/* --------------------------------- Skills -------------------------------- */

const SkillsTab = () => {
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(() => contentApi.skills.list(), []);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('General');
  const [icon, setIcon] = useState('');
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const add = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setActionError(null);
    try {
      await contentApi.skills.create({ name: name.trim(), category, icon: icon || null });
      setName('');
      setIcon('');
      toast.success('Skill added');
      reload();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Failed to add');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SectionCard>
      <SectionHeader title='Skills' description='Technologies and proficiencies.' />
      <div className='grid gap-5 p-5'>
        <ErrorBanner message={error ?? actionError} />
        <div className='grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end'>
          <Field label='Name'>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label='Category'>
            <Input value={category} onChange={(e) => setCategory(e.target.value)} />
          </Field>
          <Field label='Icon URL'>
            <Input
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder='https://…svg'
            />
          </Field>
          <Button onClick={add} disabled={saving}>
            {saving ? <Spinner className='size-4' /> : <Plus />}
            Add
          </Button>
        </div>
        {loading && !data ? (
          <LoadingState />
        ) : data?.items.length ? (
          <div className='grid gap-2'>
            {data.items.map((item) => (
              <Row
                key={item.id}
                onDelete={async () => {
                  await contentApi.skills.remove(item.id);
                  reload();
                }}
              >
                <span className='font-medium text-foreground'>{item.name}</span>
                <span className='ml-2 text-xs text-muted-foreground'>{item.category}</span>
              </Row>
            ))}
          </div>
        ) : (
          <EmptyStateBlock icon={Wrench} title='No skills yet' />
        )}
      </div>
    </SectionCard>
  );
};

/* ------------------------------- Experience ------------------------------ */

const ExperiencesTab = () => {
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(() => contentApi.experiences.list(), []);
  const [company, setCompany] = useState('');
  const [position, setPosition] = useState('');
  const [period, setPeriod] = useState('');
  const [kind, setKind] = useState<'work' | 'education'>('work');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const add = async () => {
    if (!company.trim() || !position.trim()) return;
    setSaving(true);
    setActionError(null);
    try {
      await contentApi.experiences.create({
        company: company.trim(),
        position: position.trim(),
        period: period || null,
        kind,
        description: description || null,
      });
      setCompany('');
      setPosition('');
      setPeriod('');
      setDescription('');
      toast.success('Experience added');
      reload();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Failed to add');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SectionCard>
      <SectionHeader title='Experience' description='Work history and education.' />
      <div className='grid gap-5 p-5'>
        <ErrorBanner message={error ?? actionError} />
        <div className='grid gap-3'>
          <div className='grid gap-3 sm:grid-cols-3'>
            <Field label='Company / School'>
              <Input value={company} onChange={(e) => setCompany(e.target.value)} />
            </Field>
            <Field label='Position / Title'>
              <Input value={position} onChange={(e) => setPosition(e.target.value)} />
            </Field>
            <Field label='Period'>
              <Input
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                placeholder='2023 — Present'
              />
            </Field>
          </div>
          <div className='grid gap-3 sm:grid-cols-[200px_1fr] sm:items-end'>
            <Field label='Type'>
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as 'work' | 'education')}
                className='h-9 rounded-xl border border-input bg-[color:var(--muted)]/40 px-3 text-sm text-foreground'
              >
                <option value='work'>Work</option>
                <option value='education'>Education</option>
              </select>
            </Field>
            <Field label='Description'>
              <Textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Field>
          </div>
          <div className='flex justify-end'>
            <Button onClick={add} disabled={saving}>
              {saving ? <Spinner className='size-4' /> : <Plus />}
              Add
            </Button>
          </div>
        </div>
        {loading && !data ? (
          <LoadingState />
        ) : data?.items.length ? (
          <div className='grid gap-2'>
            {data.items.map((item) => (
              <Row
                key={item.id}
                onDelete={async () => {
                  await contentApi.experiences.remove(item.id);
                  reload();
                }}
              >
                <span className='font-medium text-foreground'>{item.position}</span>
                <span className='ml-2 text-xs text-muted-foreground'>
                  {item.company} · {item.kind}
                </span>
              </Row>
            ))}
          </div>
        ) : (
          <EmptyStateBlock icon={Wrench} title='No experience entries yet' />
        )}
      </div>
    </SectionCard>
  );
};

/* -------------------------------- Services ------------------------------- */

const ServicesTab = () => {
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(() => contentApi.services.list(), []);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('layers');
  const [price, setPrice] = useState('');
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const add = async () => {
    if (!title.trim()) return;
    setSaving(true);
    setActionError(null);
    try {
      await contentApi.services.create({
        title: title.trim(),
        description: description || null,
        icon: icon || null,
        price: price || null,
      });
      setTitle('');
      setDescription('');
      setPrice('');
      toast.success('Service added');
      reload();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Failed to add');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SectionCard>
      <SectionHeader title='Services' description='Offered services and pricing.' />
      <div className='grid gap-5 p-5'>
        <ErrorBanner message={error ?? actionError} />
        <div className='grid gap-3'>
          <div className='grid gap-3 sm:grid-cols-3'>
            <Field label='Title'>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </Field>
            <Field label='Icon keyword' hint='layers, code, globe, palette…'>
              <Input value={icon} onChange={(e) => setIcon(e.target.value)} />
            </Field>
            <Field label='Price / tagline'>
              <Input value={price} onChange={(e) => setPrice(e.target.value)} />
            </Field>
          </div>
          <Field label='Description'>
            <Textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
          <div className='flex justify-end'>
            <Button onClick={add} disabled={saving}>
              {saving ? <Spinner className='size-4' /> : <Plus />}
              Add
            </Button>
          </div>
        </div>
        {loading && !data ? (
          <LoadingState />
        ) : data?.items.length ? (
          <div className='grid gap-2'>
            {data.items.map((item) => (
              <Row
                key={item.id}
                onDelete={async () => {
                  await contentApi.services.remove(item.id);
                  reload();
                }}
              >
                <span className='font-medium text-foreground'>{item.title}</span>
                <span className='ml-2 text-xs text-muted-foreground'>{item.icon}</span>
              </Row>
            ))}
          </div>
        ) : (
          <EmptyStateBlock icon={Wrench} title='No services yet' />
        )}
      </div>
    </SectionCard>
  );
};

/* ------------------------------- Navigation ------------------------------ */

const NavTab = () => {
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(() => contentApi.nav.list(), []);
  const [label, setLabel] = useState('');
  const [href, setHref] = useState('');
  const [location, setLocation] = useState<'header' | 'footer' | 'social'>('header');
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const add = async () => {
    if (!label.trim() || !href.trim()) return;
    setSaving(true);
    setActionError(null);
    try {
      await contentApi.nav.create({
        label: label.trim(),
        href: href.trim(),
        location,
        external: location === 'social' || /^https?:/.test(href),
      });
      setLabel('');
      setHref('');
      toast.success('Link added');
      reload();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Failed to add');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SectionCard>
      <SectionHeader title='Navigation' description='Header, footer and social links.' />
      <div className='grid gap-5 p-5'>
        <ErrorBanner message={error ?? actionError} />
        <div className='grid gap-3 sm:grid-cols-[1fr_1fr_160px_auto] sm:items-end'>
          <Field label='Label'>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} />
          </Field>
          <Field label='Href'>
            <Input
              value={href}
              onChange={(e) => setHref(e.target.value)}
              placeholder='#projects or https://…'
            />
          </Field>
          <Field label='Location'>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value as 'header' | 'footer' | 'social')}
              className='h-9 rounded-xl border border-input bg-[color:var(--muted)]/40 px-3 text-sm text-foreground'
            >
              <option value='header'>Header</option>
              <option value='footer'>Footer</option>
              <option value='social'>Social</option>
            </select>
          </Field>
          <Button onClick={add} disabled={saving}>
            {saving ? <Spinner className='size-4' /> : <Plus />}
            Add
          </Button>
        </div>
        {loading && !data ? (
          <LoadingState />
        ) : data?.items.length ? (
          <div className='grid gap-2'>
            {data.items.map((item) => (
              <Row
                key={item.id}
                onDelete={async () => {
                  await contentApi.nav.remove(item.id);
                  reload();
                }}
              >
                <span className='font-medium text-foreground'>{item.label}</span>
                <span className='ml-2 text-xs text-muted-foreground'>
                  {item.location} · {item.href}
                </span>
              </Row>
            ))}
          </div>
        ) : (
          <EmptyStateBlock icon={Wrench} title='No links yet' />
        )}
      </div>
    </SectionCard>
  );
};
