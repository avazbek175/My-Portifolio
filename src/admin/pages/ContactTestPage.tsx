import { useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ErrorBanner, Field, Spinner } from '@/admin/components/ui';
import { SectionCard, SectionHeader } from '@/admin/components/design';
import { useToast } from '@/admin/components/toast-context';
import { apiFetch } from '@/lib/api';

export const ContactTestPage = () => {
  const toast = useToast();
  const [name, setName] = useState('Test');
  const [email, setEmail] = useState('test@example.com');
  const [subject, setSubject] = useState('Test');
  const [message, setMessage] = useState('Hello from admin preview');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await apiFetch<{ ok: true; id: string }>('/api/public/contact', {
        method: 'POST',
        body: { name, email, subject, message },
      });
      setResult(`Message sent (id: ${response.id})`);
      toast.success('Message delivered', `Contact id ${response.id}`);
    } catch (cause) {
      const messageText = cause instanceof Error ? cause.message : 'Failed';
      setError(messageText);
      toast.error('Could not send message', messageText);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-1'>
        <h1 className='text-2xl font-semibold tracking-tight text-foreground'>Contact API test</h1>
        <p className='text-sm text-muted-foreground'>
          Send a test submission to <code className='text-foreground'>/api/public/contact</code>.
        </p>
      </div>

      <ErrorBanner message={error} />

      <SectionCard className='max-w-xl'>
        <SectionHeader title='Test submission' />
        <form onSubmit={submit} className='grid gap-4 p-5'>
          <Field label='Name'>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label='Email'>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label='Subject'>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </Field>
          <Field label='Message'>
            <Textarea rows={4} value={message} onChange={(e) => setMessage(e.target.value)} />
          </Field>
          <div className='flex items-center justify-between gap-3'>
            <Button type='submit' disabled={loading}>
              {loading ? <Spinner className='size-4 border-white/40 border-t-white' /> : null}
              Send
            </Button>
            {result && <p className='text-sm text-[color:var(--admin-success)]'>{result}</p>}
          </div>
        </form>
      </SectionCard>
    </div>
  );
};
