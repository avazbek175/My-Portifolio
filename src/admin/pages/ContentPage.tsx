import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, ErrorBanner, Field, LoadingState, PageHeader, Spinner } from '@/admin/components/ui';
import { contentApi } from '@/admin/admin-api';
import { useAsync } from '@/admin/hooks/useAsync';
import { cn } from '@/lib/utils';

type TabKey = 'skills' | 'experiences' | 'services' | 'nav';
const tabs: TabKey[] = ['skills', 'experiences', 'services', 'nav'];

export const ContentPage = () => {
  const [active, setActive] = useState<TabKey>('skills');
  return (
    <div>
      <PageHeader
        title='Content'
        description='Manage skills, experience, services and navigation links.'
      />
      <div className='mb-5 flex flex-wrap gap-1 rounded-lg border border-border p-1'>
        {tabs.map((tab) => (
          <button
            key={tab}
            type='button'
            onClick={() => setActive(tab)}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm capitalize transition-colors',
              active === tab
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab}
          </button>
        ))}
      </div>
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
}: {
  children: React.ReactNode;
  onDelete: () => void;
}) => (
  <div className='flex items-center justify-between gap-3 border-b border-border py-2 text-sm last:border-0'>
    <div className='min-w-0'>{children}</div>
    <Button variant='ghost' size='icon-sm' onClick={onDelete} aria-label='Delete'>
      <Trash2 className='text-destructive' />
    </Button>
  </div>
);

const SkillsTab = () => {
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
      reload();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Failed to add');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <ErrorBanner message={error ?? actionError} />
      {loading && !data ? (
        <LoadingState />
      ) : (
        <>
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
          <div className='mt-4'>
            {data?.items.length ? (
              data.items.map((item) => (
                <Row
                  key={item.id}
                  onDelete={async () => {
                    await contentApi.skills.remove(item.id);
                    reload();
                  }}
                >
                  <span className='font-medium text-foreground'>{item.name}</span>
                  <span className='ml-2 text-xs text-muted-foreground'>
                    {item.category}
                  </span>
                </Row>
              ))
            ) : (
              <p className='text-sm text-muted-foreground'>No skills yet.</p>
            )}
          </div>
        </>
      )}
    </Card>
  );
};

const ExperiencesTab = () => {
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
      reload();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Failed to add');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <ErrorBanner message={error ?? actionError} />
      {loading && !data ? (
        <LoadingState />
      ) : (
        <>
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
                  className='h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground'
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
          <div className='mt-4'>
            {data?.items.length ? (
              data.items.map((item) => (
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
              ))
            ) : (
              <p className='text-sm text-muted-foreground'>No entries yet.</p>
            )}
          </div>
        </>
      )}
    </Card>
  );
};

const ServicesTab = () => {
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
      reload();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Failed to add');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <ErrorBanner message={error ?? actionError} />
      {loading && !data ? (
        <LoadingState />
      ) : (
        <>
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
          <div className='mt-4'>
            {data?.items.length ? (
              data.items.map((item) => (
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
              ))
            ) : (
              <p className='text-sm text-muted-foreground'>No services yet.</p>
            )}
          </div>
        </>
      )}
    </Card>
  );
};

const NavTab = () => {
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
      reload();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Failed to add');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <ErrorBanner message={error ?? actionError} />
      {loading && !data ? (
        <LoadingState />
      ) : (
        <>
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
                onChange={(e) =>
                  setLocation(e.target.value as 'header' | 'footer' | 'social')
                }
                className='h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground'
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
          <div className='mt-4'>
            {data?.items.length ? (
              data.items.map((item) => (
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
              ))
            ) : (
              <p className='text-sm text-muted-foreground'>No links yet.</p>
            )}
          </div>
        </>
      )}
    </Card>
  );
};
