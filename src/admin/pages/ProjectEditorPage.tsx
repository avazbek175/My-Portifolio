import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ImagePlus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, ErrorBanner, Field, LoadingState } from '@/admin/components/ui';
import { MediaPicker } from '@/admin/components/MediaPicker';
import { createProject, updateProject } from '@/admin/admin-api';

type FormState = {
  title: string;
  slug: string;
  summary: string;
  description: string;
  category: string;
  tags: string;
  coverUrl: string;
  repoUrl: string;
  liveUrl: string;
  status: 'draft' | 'published';
  featured: boolean;
  seoTitle: string;
  seoDescription: string;
  gallery: string[];
};

const emptyForm: FormState = {
  title: '',
  slug: '',
  summary: '',
  description: '',
  category: 'General',
  tags: '',
  coverUrl: '',
  repoUrl: '',
  liveUrl: '',
  featured: false,
  status: 'draft',
  seoTitle: '',
  seoDescription: '',
  gallery: [],
};

export const ProjectEditorPage = () => {
  const { id } = useParams();
  
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>({ ...emptyForm, slug: '' });
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickerFor, setPickerFor] = useState<'cover' | 'gallery' | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoading(true);
    import('@/admin/admin-api').then(({ getProject: fetchProject }) =>
      fetchProject(id)
        .then((project) => {
          if (!active) return;
          setForm({
            title: project.title,
            slug: project.slug,
            summary: project.summary,
            description: project.description,
            category: project.category,
            tags: project.tags.join(', '),
            coverUrl: project.coverUrl ?? '',
            repoUrl: project.repoUrl ?? '',
            liveUrl: project.liveUrl ?? '',
            featured: project.featured,
            status: project.status,
            seoTitle: project.seoTitle ?? '',
            seoDescription: project.seoDescription ?? '',
            gallery: project.gallery,
          });
        })
        .catch((cause: unknown) => {
          if (active) setError(cause instanceof Error ? cause.message : 'Failed to load');
        })
        .finally(() => {
          if (active) setLoading(false);
        }),
    );
    return () => {
      active = false;
    };
  }, [id]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        title: form.title.trim(),
        slug: form.slug.trim() || undefined,
        summary: form.summary.trim(),
        description: form.description,
        category: form.category.trim() || 'General',
        tags: form.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
        coverUrl: form.coverUrl.trim() || null,
        repoUrl: form.repoUrl.trim() || null,
        liveUrl: form.liveUrl.trim() || null,
        gallery: form.gallery,
        featured: form.featured,
        status: form.status,
        seoTitle: form.seoTitle.trim() || null,
        seoDescription: form.seoDescription.trim() || null,
      };
      if (id) await updateProject(id, payload);
      else await createProject(payload);
      navigate('/admin/projects', { replace: true });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState label='Loading project…' />;

  return (
    <div>
      <div className='mb-6 flex items-center gap-3'>
        <Button asChild variant='ghost' size='icon-sm'>
          <Link to='/admin/projects' aria-label='Back to projects'>
            <ArrowLeft />
          </Link>
        </Button>
        <h1 className='text-2xl font-semibold text-foreground'>
          {id ? 'Edit project' : 'New project'}
        </h1>
      </div>

      <ErrorBanner message={error} />

      <form onSubmit={handleSubmit} className='grid gap-5'>
        <Card className='grid gap-4'>
          <Field label='Title'>
            <Input
              required
              value={form.title}
              onChange={(event) => update('title', event.target.value)}
              placeholder='Project name'
            />
          </Field>

          <Field label='Slug' hint='Leave empty to generate from the title.'>
            <Input
              value={form.slug}
              onChange={(event) => update('slug', event.target.value)}
              placeholder='my-project'
            />
          </Field>

          <Field label='Summary' hint='Short description shown in lists.'>
            <Input
              value={form.summary}
              onChange={(event) => update('summary', event.target.value)}
              placeholder='One-line summary'
            />
          </Field>

          <Field label='Description'>
            <Textarea
              rows={6}
              value={form.description}
              onChange={(event) => update('description', event.target.value)}
              placeholder='Full project description…'
            />
          </Field>

          <div className='grid gap-4 sm:grid-cols-2'>
            <Field label='Category'>
              <Input
                value={form.category}
                onChange={(event) => update('category', event.target.value)}
              />
            </Field>
            <Field label='Tags' hint='Comma separated, e.g. React, TypeScript'>
              <Input
                value={form.tags}
                onChange={(event) => update('tags', event.target.value)}
              />
            </Field>
          </div>

          <div className='grid gap-4 sm:grid-cols-2'>
            <Field label='Repository URL'>
              <Input
                value={form.repoUrl}
                onChange={(event) => update('repoUrl', event.target.value)}
                placeholder='https://github.com/…'
              />
            </Field>
            <Field label='Live URL'>
              <Input
                value={form.liveUrl}
                onChange={(event) => update('liveUrl', event.target.value)}
                placeholder='https://…'
              />
            </Field>
          </div>
        </Card>

        <Card className='grid gap-4'>
          <div className='flex items-center justify-between'>
            <span className='text-sm font-medium text-foreground'>Cover image</span>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={() => setPickerFor('cover')}
            >
              <ImagePlus />
              Choose
            </Button>
          </div>

          <div className='grid gap-3 sm:grid-cols-[120px_1fr] sm:items-center'>
            <div className='flex aspect-video items-center justify-center overflow-hidden rounded-lg border border-border bg-background'>
              {form.coverUrl ? (
                <img src={form.coverUrl} alt='Cover' className='size-full object-cover' />
              ) : (
                <span className='text-xs text-muted-foreground'>No image</span>
              )}
            </div>
            <Input
              value={form.coverUrl}
              onChange={(event) => update('coverUrl', event.target.value)}
              placeholder='/api/files/… or https://…'
            />
          </div>

          <div>
            <div className='flex items-center justify-between'>
              <span className='text-sm font-medium text-foreground'>Gallery</span>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => setPickerFor('gallery')}
              >
                <ImagePlus />
                Add image
              </Button>
            </div>

            {form.gallery.length > 0 ? (
              <div className='mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4'>
                {form.gallery.map((url, index) => (
                  <div
                    key={`${url}-${index}`}
                    className='group relative overflow-hidden rounded-xl border border-border'
                  >
                    <img
                      src={url}
                      alt=''
                      className='aspect-square w-full object-cover'
                    />
                    <button
                      type='button'
                      onClick={() =>
                        update(
                          'gallery',
                          form.gallery.filter((_, i) => i !== index),
                        )
                      }
                      className='absolute right-1 top-1 rounded-md bg-background/80 p-1 text-destructive opacity-0 transition-opacity group-hover:opacity-100'
                      aria-label='Remove image'
                    >
                      <Trash2 className='size-4' />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className='mt-2 text-xs text-muted-foreground'>No gallery images.</p>
            )}
          </div>
        </Card>

        <Card className='grid gap-4'>
          <div className='flex flex-wrap items-center gap-6'>
            <label className='flex items-center gap-2 text-sm text-foreground'>
              <input
                type='checkbox'
                checked={form.featured}
                onChange={(event) => update('featured', event.target.checked)}
                className='size-4 accent-primary'
              />
              Featured
            </label>
            <Field label='Status'>
              <select
                value={form.status}
                onChange={(event) =>
                  update('status', event.target.value as 'draft' | 'published')
                }
                className='h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground'
              >
                <option value='draft'>Draft</option>
                <option value='published'>Published</option>
              </select>
            </Field>
          </div>

          <div className='grid gap-4 sm:grid-cols-2'>
            <Field label='SEO title'>
              <Input
                value={form.seoTitle}
                onChange={(event) => update('seoTitle', event.target.value)}
              />
            </Field>
            <Field label='SEO description'>
              <Input
                value={form.seoDescription}
                onChange={(event) => update('seoDescription', event.target.value)}
              />
            </Field>
          </div>
        </Card>

        <Card className='grid gap-4'>
          <div className='flex flex-wrap items-center gap-6'>
            <label className='flex items-center gap-2 text-sm text-foreground'>
              <input
                type='checkbox'
                checked={form.featured}
                onChange={(event) => update('featured', event.target.checked)}
                className='size-4 accent-primary'
              />
              Featured
            </label>
            <Field label='Status'>
              <select
                value={form.status}
                onChange={(event) =>
                  update('status', event.target.value as 'draft' | 'published')
                }
                className='h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground'
              >
                <option value='draft'>Draft</option>
                <option value='published'>Published</option>
              </select>
            </Field>
          </div>

          <div className='grid gap-4 sm:grid-cols-2'>
            <Field label='SEO title'>
              <Input
                value={form.seoTitle}
                onChange={(event) => update('seoTitle', event.target.value)}
              />
            </Field>
            <Field label='SEO description'>
              <Input
                value={form.seoDescription}
                onChange={(event) => update('seoDescription', event.target.value)}
              />
            </Field>
          </div>
        </Card>

        <div className='flex items-center justify-end gap-3'>
          <Button asChild variant='outline'>
            <Link to='/admin/projects'>Cancel</Link>
          </Button>
          <Button type='submit' disabled={saving}>
            {saving ? 'Saving…' : id ? 'Save changes' : 'Create project'}
          </Button>
        </div>
      </form>

      <MediaPicker
        open={pickerFor !== null}
        onClose={() => setPickerFor(null)}
        onSelect={(url) => {
          if (pickerFor === 'cover') update('coverUrl', url);
          else if (pickerFor === 'gallery') update('gallery', [...form.gallery, url]);
        }}
      />
    </div>
  );
};
