import { Navigate, Outlet } from 'react-router-dom';

import { useAuth } from '@/context/useAuth';
import { LoadingState } from '@/admin/components/ui';

export const ProtectedAdmin = () => {
  const { admin, loading } = useAuth();

  if (loading) return <LoadingState label='Checking session…' />;
  if (!admin) return <Navigate to='/admin/login' replace />;
  return <Outlet />;
};
