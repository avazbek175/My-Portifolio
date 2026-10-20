import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ErrorBanner, Spinner } from '@/admin/components/ui';
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

  const inputClass =
    'h-11 w-full rounded-xl border border-border bg-[color:var(--muted)]/40 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40';

  return (
    <div className='admin-shell flex min-h-screen items-stretch'>
      <div className='relative hidden flex-1 flex-col justify-between overflow-hidden p-10 lg:flex'>
        <div className='flex items-center gap-3'>
          <span className='accent-gradient flex size-11 items-center justify-center rounded-2xl text-base font-bold text-white shadow-lg'>
            C
          </span>
          <span className='leading-tight'>
            <span className='block text-base font-semibold tracking-tight text-foreground'>
              CYBERAVAZ
            </span>
            <span className='block text-xs text-muted-foreground'>Portfolio CMS</span>
          </span>
        </div>

        <div className='max-w-md'>
          <h1 className='text-4xl font-semibold leading-tight tracking-tight text-foreground'>
            Manage your portfolio, <span className='gradient-text'>end to end.</span>
          </h1>
          <p className='mt-4 text-sm leading-relaxed text-muted-foreground'>
            Publish projects, curate your media library and keep content in sync — all from
            one focused control panel.
          </p>
          <div className='mt-8 flex gap-6'>
            {[
              { label: 'Projects', value: 'CMS' },
              { label: 'Media', value: 'Blob' },
              { label: 'Security', value: 'CSRF' },
            ].map((item) => (
              <div key={item.label}>
                <p className='text-lg font-semibold text-foreground'>{item.value}</p>
                <p className='text-xs text-muted-foreground'>{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className='text-xs text-muted-foreground'>© {new Date().getFullYear()} cyberavaz</p>
      </div>

      <div className='flex flex-1 items-center justify-center px-4 py-12 sm:px-8'>
        <div className='w-full max-w-sm'>
          <div className='mb-8 flex flex-col items-center gap-3 text-center lg:items-start lg:text-left'>
            <span className='accent-gradient flex size-12 items-center justify-center rounded-2xl text-base font-bold text-white shadow-lg lg:hidden'>
              C
            </span>
            <div>
              <h1 className='text-2xl font-semibold tracking-tight text-foreground'>Welcome back</h1>
              <p className='mt-1 text-sm text-muted-foreground'>
                Sign in to your admin account
              </p>
            </div>
          </div>

          <ErrorBanner message={error} />

          <form onSubmit={handleSubmit} className='grid gap-4' noValidate>
            <label className='grid gap-2'>
              <span className='text-sm font-medium text-foreground'>Email</span>
              <div className='relative'>
                <Mail className='pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
                <input
                  type='email'
                  autoComplete='username'
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder='you@example.com'
                  className={inputClass}
                />
              </div>
            </label>

            <label className='grid gap-2'>
              <span className='text-sm font-medium text-foreground'>Password</span>
              <div className='relative'>
                <Lock className='pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
                <input
                  type='password'
                  autoComplete='current-password'
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder='••••••••'
                  className={inputClass}
                />
              </div>
            </label>

            <Button type='submit' disabled={submitting} size='lg' className='mt-2 w-full'>
              {submitting ? <Spinner className='size-4 border-white/40 border-t-white' /> : null}
              Sign in
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
