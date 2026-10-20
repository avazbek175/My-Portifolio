import { lazy } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';

import { AdminLayout } from './AdminLayout';
import { ProtectedAdmin } from './ProtectedAdmin';
import { LoginPage } from './pages/LoginPage';

const DashboardPage = lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const ProjectsPage = lazy(() => import('./pages/ProjectsPage').then((m) => ({ default: m.ProjectsPage })));
const ProjectEditorPage = lazy(() => import('./pages/ProjectEditorPage').then((m) => ({ default: m.ProjectEditorPage })));
const MediaPage = lazy(() => import('./pages/MediaPage').then((m) => ({ default: m.MediaPage })));
const MessagesPage = lazy(() => import('./pages/MessagesPage').then((m) => ({ default: m.MessagesPage })));
const ContentPage = lazy(() => import('./pages/ContentPage').then((m) => ({ default: m.ContentPage })));
const AuditPage = lazy(() => import('./pages/AuditPage').then((m) => ({ default: m.AuditPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const ContactTestPage = lazy(() => import('./pages/ContactTestPage').then((m) => ({ default: m.ContactTestPage })));

export const AdminShell = () => (
  <Routes>
    <Route path='login' element={<LoginPage />} />
    <Route element={<ProtectedAdmin />}>
      <Route element={<AdminLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path='projects' element={<ProjectsPage />} />
        <Route path='projects/new' element={<ProjectEditorPage />} />
        <Route path='projects/:id' element={<ProjectEditorPage />} />
        <Route path='media' element={<MediaPage />} />
        <Route path='messages' element={<MessagesPage />} />
        <Route path='content' element={<ContentPage />} />
        <Route path='audit' element={<AuditPage />} />
        <Route path='settings' element={<SettingsPage />} />
        <Route path='contact-test' element={<ContactTestPage />} />
        <Route path='*' element={<Navigate to='.' replace />} />
      </Route>
    </Route>
    <Route path='*' element={<Navigate to='login' replace />} />
  </Routes>
);
