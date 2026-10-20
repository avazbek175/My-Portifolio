/**
 * Admin dashboard routes.
 */

import { Hono } from 'hono';
import { getDashboardStats } from '../services/dashboard.service';
import type { AppEnv } from '../types';

export const dashboardRoutes = new Hono<AppEnv>();

dashboardRoutes.get('/stats', async (c) => c.json(await getDashboardStats()));
