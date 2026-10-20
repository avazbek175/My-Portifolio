import type { Admin } from '@/lib/cms-types';

export type AuthContextValue = {
  admin: Admin | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  setAdmin: (admin: Admin) => void;
};
