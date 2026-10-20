/**
 * Public content aggregation for the portfolio frontend.
 *
 * Only published and visible content is returned. Draft projects and hidden
 * collections are never exposed through these functions.
 */

import {
  experiencesCollection,
  getPage,
  getSettings,
  navCollection,
  servicesCollection,
  skillsCollection,
  type Experience,
  type NavLink,
  type ServiceItem,
  type Skill,
} from './content.service';
import { listPublishedProjects, type Project } from './projects.service';

export type PublicContent = {
  settings: Record<string, Record<string, unknown>>;
  pages: {
    home: Record<string, unknown> | null;
    about: Record<string, unknown> | null;
    contact: Record<string, unknown> | null;
  };
  nav: {
    header: NavLink[];
    footer: NavLink[];
    social: NavLink[];
  };
  skills: Skill[];
  experiences: Experience[];
  services: ServiceItem[];
  projects: Project[];
};

export const getPublicContent = async (): Promise<PublicContent> => {
  const [settings, home, about, contact] = await Promise.all([
    getSettings(),
    getPage('home'),
    getPage('about'),
    getPage('contact'),
  ]);

  const [header, footer, social, skills, experiences, services, projects] =
    await Promise.all([
      navCollection.list({ visible: true, location: 'header' }),
      navCollection.list({ visible: true, location: 'footer' }),
      navCollection.list({ visible: true, location: 'social' }),
      skillsCollection.list({ visible: true }),
      experiencesCollection.list({ visible: true }),
      servicesCollection.list({ visible: true }),
      listPublishedProjects(),
    ]);

  return {
    settings,
    pages: {
      home: home?.content ?? null,
      about: about?.content ?? null,
      contact: contact?.content ?? null,
    },
    nav: { header, footer, social },
    skills,
    experiences,
    services,
    projects,
  };
};

export type { Project, NavLink, Skill, Experience, ServiceItem };
