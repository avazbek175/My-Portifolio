import { useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, ErrorBanner, Field, PageHeader, Spinner } from '@/admin/components/ui';
import { apiFetch } from '@/lib/api';

export const ContactTestPage = () => {
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
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title='Contact API test' description='Post to /api/public/contact' />
      <ErrorBanner message={error} />
      <Card className='max-w-xl'>
        <form onSubmit={submit} className='grid gap-4'>
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
          <Button type='submit' disabled={loading}>
            {loading ? <Spinner className='size-4' /> : null} Send
          </Button>
          {result && <p className='text-sm text-primary'>{result}</p>}
        </form>
      </Card>
    </div>
  );
};
