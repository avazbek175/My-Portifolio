import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { apiFetch, setCsrfToken } from '@/lib/api';
import type { Admin } from '@/lib/cms-types';
import { AuthContext } from './auth-context';

type LoginResponse = { admin: Admin; csrfToken: string };

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [admin, setAdminState] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const response = await apiFetch<LoginResponse>('/api/auth/me');
      setCsrfToken(response.csrfToken);
      setAdminState(response.admin);
    } catch {
      setCsrfToken(null);
      setAdminState(null);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      await load();
      if (active) setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [load]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await apiFetch<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    setCsrfToken(response.csrfToken);
    setAdminState(response.admin);
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setCsrfToken(null);
      setAdminState(null);
    }
  }, []);

  const refresh = useCallback(async () => {
    await load();
  }, [load]);

  const setAdmin = useCallback((next: Admin) => setAdminState(next), []);

  const value = useMemo(
    () => ({ admin, loading, login, logout, refresh, setAdmin }),
    [admin, loading, login, logout, refresh, setAdmin],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
