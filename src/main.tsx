/**
 * @copyright 2025 cyberavaz
 * @license Apache-2.0
 */

import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { ContentProvider } from '@/context/ContentContext';
import { AuthProvider } from '@/context/AuthProvider';
import { LoadingState } from '@/admin/components/ui';
import './index.css';

import { PublicSite } from '@/pages/PublicSite';

const AdminShell = lazy(() =>
  import('@/admin/AdminShell').then((module) => ({ default: module.AdminShell })),
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route
            path='/*'
            element={
              <ContentProvider>
                <PublicSite />
              </ContentProvider>
            }
          />
          <Route
            path='/admin/*'
            element={
              <Suspense fallback={<LoadingState label='Loading admin…' />}>
                <AdminShell />
              </Suspense>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
