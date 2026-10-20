import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, ErrorBanner, Spinner } from '@/admin/components/ui';
import { useAuth } from '@/context/useAuth';

export const LoginPage = () => {
  const { admin, loading, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && admin) return <Navigate to='/admin' replace />;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(email, password);
      navigate('/admin', { replace: true });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to sign in');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className='flex min-h-screen items-center justify-center bg-background px-4'>
      <div className='w-full max-w-sm rounded-2xl border border-border bg-card p-6 sm:p-8'>
        <div className='mb-6 flex items-center gap-3'>
          <span className='flex size-10 items-center justify-center rounded-xl bg-primary text-base font-bold text-primary-foreground'>
            A
          </span>
          <div>
            <h1 className='text-lg font-semibold text-foreground'>Admin sign in</h1>
            <p className='text-xs text-muted-foreground'>Portfolio control panel</p>
          </div>
        </div>

        <ErrorBanner message={error} />

        <form onSubmit={handleSubmit} className='grid gap-4' noValidate>
          <Field label='Email'>
            <Input
              type='email'
              autoComplete='username'
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder='you@example.com'
            />
          </Field>

          <Field label='Password'>
            <Input
              type='password'
              autoComplete='current-password'
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder='••••••••'
            />
          </Field>

          <Button type='submit' disabled={submitting} className='mt-2 w-full'>
            {submitting ? <Spinner className='size-4 border-white/40 border-t-white' /> : null}
            Sign in
          </Button>
        </form>
      </div>
    </div>
  );
};
