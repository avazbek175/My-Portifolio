import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, ErrorBanner, Field, LoadingState, PageHeader, Spinner } from '@/admin/components/ui';
import { changePassword, listSessions, revokeSession, updateProfile } from '@/admin/admin-api';
import { useAsync } from '@/admin/hooks/useAsync';
import { useAuth } from '@/context/useAuth';

export const SettingsPage = () => {
  const { admin, setAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(admin?.name ?? '');
  const [email, setEmail] = useState(admin?.email ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const { data: sessions, loading: sessionsLoading, reload: reloadSessions } = useAsync(
    () => listSessions(),
    [],
  );

  useEffect(() => {
    setName(admin?.name ?? '');
    setEmail(admin?.email ?? '');
  }, [admin]);

  const handleProfile = async () => {
    setSavingProfile(true);
    setError(null);
    setMessage(null);
    try {
      const result = await updateProfile({
        name: name.trim() || undefined,
        email: email.trim() || undefined,
      });
      setAdmin(result.admin);
      setMessage('Profile updated');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePassword = async () => {
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setSavingPassword(true);
    setError(null);
    setMessage(null);
    try {
      await changePassword(currentPassword, newPassword);
      setMessage('Password changed. You may be signed out on other devices.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      reloadSessions();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!window.confirm('Revoke this session?')) return;
    try {
      await revokeSession(id);
      reloadSessions();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Failed to revoke session');
    }
  };

  return (
    <div className='grid gap-5'>
      <PageHeader title='Account & settings' description='Manage your profile and security.' />

      <ErrorBanner message={error} />
      {message && (
        <div className='rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-primary'>
          {message}
        </div>
      )}

      <Card className='grid gap-4'>
        <h2 className='text-base font-semibold text-foreground'>Profile</h2>
        <div className='grid gap-4 sm:grid-cols-2'>
          <Field label='Name'>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label='Email'>
            <Input type='email' value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
        </div>
        <div className='flex justify-end'>
          <Button onClick={handleProfile} disabled={savingProfile}>
            {savingProfile ? <Spinner className='size-4' /> : null}
            Save profile
          </Button>
        </div>
      </Card>

      <Card className='grid gap-4'>
        <h2 className='text-base font-semibold text-foreground'>Password</h2>
        <Field label='Current password'>
          <Input
            type='password'
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </Field>
        <div className='grid gap-4 sm:grid-cols-2'>
          <Field label='New password' hint='Must be at least 10 chars with A-Z, a-z, 0-9'>
            <Input
              type='password'
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </Field>
          <Field label='Confirm new password'>
            <Input
              type='password'
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </Field>
        </div>
        <div className='flex justify-end'>
          <Button onClick={handlePassword} disabled={savingPassword}>
            {savingPassword ? <Spinner className='size-4' /> : null}
            Change password
          </Button>
        </div>
      </Card>

      <Card className='grid gap-4'>
        <div className='flex items-center justify-between'>
          <h2 className='text-base font-semibold text-foreground'>Sessions</h2>
          <Button variant='outline' size='sm' onClick={() => reloadSessions()}>
            Refresh
          </Button>
        </div>
        {sessionsLoading && !sessions ? (
          <LoadingState />
        ) : sessions ? (
          <div className='overflow-hidden rounded-xl border border-border'>
            <table className='w-full text-sm'>
              <thead className='bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground'>
                <tr>
                  <th className='px-4 py-2'>Created</th>
                  <th className='px-4 py-2'>Last seen</th>
                  <th className='px-4 py-2'>IP</th>
                  <th className='px-4 py-2'>User agent</th>
                  <th className='px-4 py-2'></th>
                </tr>
              </thead>
              <tbody className='divide-y divide-border'>
                {sessions.items.map((s) => (
                  <tr key={s.id} className='bg-card'>
                    <td className='px-4 py-2 text-xs text-muted-foreground'>
                      {new Date(s.created_at).toLocaleString()}
                    </td>
                    <td className='px-4 py-2 text-xs text-muted-foreground'>
                      {new Date(s.last_seen_at).toLocaleString()}
                    </td>
                    <td className='px-4 py-2 text-xs'>{s.ip ?? '-'}</td>
                    <td className='max-w-sm truncate px-4 py-2 text-xs text-muted-foreground'>
                      {s.user_agent ?? '-'}
                    </td>
                    <td className='px-4 py-2 text-right'>
                      {s.current ? (
                        <span className='text-xs text-primary'>Current</span>
                      ) : (
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => handleRevoke(s.id)}
                        >
                          Revoke
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </Card>

      <Card>
        <h2 className='text-base font-semibold text-foreground'>Danger zone</h2>
        <p className='mt-1 text-sm text-muted-foreground'>
          Sign out of your current admin session.
        </p>
        <div className='mt-4 flex justify-end'>
          <Button
            variant='destructive'
            onClick={async () => {
              await logout();
              navigate('/admin/login', { replace: true });
            }}
          >
            Sign out
          </Button>
        </div>
      </Card>
    </div>
  );
};
