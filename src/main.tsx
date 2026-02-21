/**
 * @copyright 2025 cyberavaz
 * @license Apache-2.0
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Sidebar } from '@/components/Sidebar';
import './index.css';

import { App } from '@/App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div className="min-h-screen lg:flex lg:justify-center lg:items-start lg:gap-10">
    <Sidebar/>
    <App />
    </div>
  </StrictMode>,
)
