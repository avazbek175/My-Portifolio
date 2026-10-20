import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, ShieldCheck, UserCog } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  EmptyStateBlock,
  SectionCard,
  SectionHeader,
  Skeleton,
} from '@/admin/components/design';
import { formatRelative } from '@/admin/components/format';
import { ErrorBanner, Field, Spinner } from '@/admin/components/ui';
import { ConfirmDialog } from '@/admin/components/ConfirmDialog';
import { useToast } from '@/admin/components/toast-context';
import { changePassword, listSessions, revokeSession, updateProfile } from '@/admin/admin-api';
import { useAsync } from '@/admin/hooks/useAsync';
import { useAuth } from '@/context/useAuth';
import type { SessionSummary } from '@/lib/cms-types';

export const SettingsPage = () => {
  const { admin, setAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [name, setName] = useState(admin?.name ?? '');
  const [email, setEmail] = useState(admin?.email ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<SessionSummary | null>(null);

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
    try {
      const result = await updateProfile({
        name: name.trim() || undefined,
        email: email.trim() || undefined,
      });
      setAdmin(result.admin);
      toast.success('Profile updated');
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Failed to update profile';
      setError(message);
      toast.error('Could not update profile', message);
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
    try {
      await changePassword(currentPassword, newPassword);
      toast.success('Password changed', 'Other sessions may be signed out.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      reloadSessions();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Failed to change password';
      setError(message);
      toast.error('Could not change password', message);
    } finally {
      setSavingPassword(false);
    }
  };

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    try {
      await revokeSession(revokeTarget.id);
      toast.success('Session revoked');
      setRevokeTarget(null);
      reloadSessions();
    } catch (cause) {
      toast.error('Could not revoke session', cause instanceof Error ? cause.message : undefined);
    }
  };

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-1'>
        <h1 className='text-2xl font-semibold tracking-tight text-foreground'>
          Account & Settings
        </h1>
        <p className='text-sm text-muted-foreground'>Manage your profile and security.</p>
      </div>

      <ErrorBanner message={error} />

      <div className='grid gap-5 lg:grid-cols-2'>
        <SectionCard>
          <SectionHeader title='Profile' />
          <div className='grid gap-4 p-5'>
            <Field label='Name'>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label='Email'>
              <Input type='email' value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <div className='flex justify-end'>
              <Button onClick={handleProfile} disabled={savingProfile}>
                {savingProfile ? <Spinner className='size-4' /> : <UserCog className='size-4' />}
                Save profile
              </Button>
            </div>
          </div>
        </SectionCard>

        <SectionCard>
          <SectionHeader title='Password' />
          <div className='grid gap-4 p-5'>
            <Field label='Current password'>
              <Input
                type='password'
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </Field>
            <div className='grid gap-4 sm:grid-cols-2'>
              <Field label='New password' hint='Min 10 chars with A-Z, a-z, 0-9'>
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
                {savingPassword ? <Spinner className='size-4' /> : <ShieldCheck className='size-4' />}
                Change password
              </Button>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard>
        <SectionHeader
          title='Active sessions'
          description='Devices currently signed in to your account.'
          actions={
            <Button variant='outline' size='sm' onClick={() => reloadSessions()}>
              <RefreshCw className='size-4' />
              Refresh
            </Button>
          }
        />
        <div className='p-5'>
          {sessionsLoading && !sessions ? (
            <div className='space-y-2'>
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className='h-12 rounded-xl' />
              ))}
            </div>
          ) : sessions && sessions.items.length === 0 ? (
            <EmptyStateBlock icon={ShieldCheck} title='No active sessions' />
          ) : (
            <ul className='space-y-2'>
              {sessions?.items.map((session) => (
                <li
                  key={session.id}
                  className='flex flex-wrap items-center gap-3 rounded-xl border border-border/60 p-3'
                >
                  <span className='min-w-0 flex-1'>
                    <span className='flex items-center gap-2 text-sm font-medium text-foreground'>
                      {session.ip ?? 'Unknown IP'}
                      {session.current && (
                        <span className='rounded-full border border-[color:var(--admin-success)]/40 bg-[color:var(--admin-success)]/10 px-2 py-0.5 text-[10px] font-medium text-[color:var(--admin-success)]'>
                          This device
                        </span>
                      )}
                    </span>
                    <span className='mt-0.5 block truncate text-xs text-muted-foreground'>
                      {session.user_agent ?? 'Unknown browser'} · seen{' '}
                      {formatRelative(session.last_seen_at)}
                    </span>
                  </span>
                  {!session.current && (
                    <Button variant='ghost' size='sm' onClick={() => setRevokeTarget(session)}>
                      Revoke
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </SectionCard>

      <SectionCard>
        <SectionHeader title='Danger zone' description='End your current admin session.' />
        <div className='flex justify-end p-5'>
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
      </SectionCard>

      <ConfirmDialog
        open={Boolean(revokeTarget)}
        onClose={() => setRevokeTarget(null)}
        onConfirm={handleRevoke}
        destructive
        confirmLabel='Revoke session'
        title='Revoke this session?'
        description={
          revokeTarget
            ? `${revokeTarget.ip ?? 'This device'} will be signed out immediately.`
            : undefined
        }
      />
    </div>
  );
};
