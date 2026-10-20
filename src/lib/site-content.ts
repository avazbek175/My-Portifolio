/**
 * Maps API `PublicContent` into the view models used by the public sections.
 * Every field falls back to the bundled static content so the site renders even
 * when the API is unavailable.
 */

import type {
  AboutType,
  ContactInfoType,
  ExperienceType,
  HeroType,
  LinksType,
  ProjectType,
  ServiceType,
  StatsType,
  TestimonialsType,
  ToolsType,
} from '@/types';
import {
  aboutData as fallbackAbout,
  contactInfo as fallbackContact,
  education as fallbackEducation,
  experience as fallbackExperience,
  heroData as fallbackHero,
  navLinks as fallbackNav,
  projectsData as fallbackProjects,
  services as fallbackServices,
  socialLinks as fallbackSocial,
  statsData as fallbackStats,
  testimonials as fallbackTestimonials,
  tools as fallbackTools,
} from '@/constants';
import type { NavLink, PublicContent } from './cms-types';
import { navIcon, serviceIcon, socialIcon } from './icons';

export type SiteSettings = {
  name: string;
  title: string;
  description: string;
  accentColor: string;
  footerNote: string;
  ogImage: string;
};

export type SiteContent = {
  hero: HeroType;
  stats: StatsType[];
  about: AboutType;
  contact: ContactInfoType;
  projects: ProjectType[];
  services: ServiceType[];
  education: ExperienceType[];
  experience: ExperienceType[];
  tools: ToolsType[];
  navLinks: LinksType[];
  socialLinks: LinksType[];
  testimonials: TestimonialsType[];
  settings: SiteSettings;
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const str = (value: unknown, fallback: string): string =>
  typeof value === 'string' && value.trim().length > 0 ? value : fallback;

const strArray = (value: unknown, fallback: string[]): string[] => {
  if (Array.isArray(value)) {
    const items = value.filter((item): item is string => typeof item === 'string');
    if (items.length > 0) return items;
  }
  return fallback;
};

const toStats = (value: unknown, fallback: StatsType[]): StatsType[] => {
  if (!Array.isArray(value)) return fallback;
  const stats = value
    .map((item) => asRecord(item))
    .map((item) => ({
      number: str(item.number, ''),
      label: str(item.label, ''),
    }))
    .filter((item) => item.number && item.label);
  return stats.length > 0 ? stats : fallback;
};

const toNav = (links: NavLink[], fallback: LinksType[]): LinksType[] => {
  if (links.length === 0) return fallback;
  return links.map((link) => ({
    label: link.label,
    link: link.href,
    icon: navIcon(link.label),
  }));
};

const toSocial = (links: NavLink[], fallback: LinksType[]): LinksType[] => {
  if (links.length === 0) return fallback;
  return links.map((link) => ({
    label: link.label,
    link: link.href,
    icon: socialIcon(link.label),
  }));
};

const FALLBACK_SITE = {
  name: 'Avazbek',
  title: 'CYBERAVAZ | Frontend Designer & Developer',
  description: fallbackHero.description,
  accentColor: '#4ade80',
  footerNote: 'Built with React, TypeScript & Tailwind CSS.',
  ogImage: '/avatar.jpg',
};

export const buildSiteContent = (data: PublicContent | null): SiteContent => {
  if (!data) {
    return {
      hero: fallbackHero,
      stats: fallbackStats,
      about: fallbackAbout,
      contact: fallbackContact,
      projects: fallbackProjects,
      services: fallbackServices,
      education: fallbackEducation,
      experience: fallbackExperience,
      tools: fallbackTools,
      navLinks: fallbackNav,
      socialLinks: fallbackSocial,
      testimonials: fallbackTestimonials,
      settings: FALLBACK_SITE,
    };
  }

  const home = asRecord(data.pages.home);
  const about = asRecord(data.pages.about);
  const contact = asRecord(data.pages.contact);
  const site = asRecord(data.settings.site);

  const hero: HeroType = {
    badge: str(home.badge, fallbackHero.badge),
    greeting: str(home.greeting, fallbackHero.greeting),
    name: str(home.name, fallbackHero.name),
    role: str(home.role, fallbackHero.role),
    description: str(home.description, fallbackHero.description),
  };

  const experiences = data.experiences;
  const educationItems: ExperienceType[] = experiences
    .filter((item) => item.kind === 'education')
    .map((item) => ({
      year: item.period ?? '',
      title: item.position,
      institute: item.company,
      desc: item.description ?? '',
    }));
  const workItems: ExperienceType[] = experiences
    .filter((item) => item.kind === 'work')
    .map((item) => ({
      year: item.period ?? '',
      title: item.position,
      institute: item.company,
      desc: item.description ?? '',
    }));

  const tools: ToolsType[] = data.skills
    .filter((skill) => Boolean(skill.icon))
    .map((skill) => ({ imgSrc: skill.icon as string, label: skill.name }));

  const projects: ProjectType[] = data.projects.map((project) => ({
    imgSrc: project.coverUrl ?? project.gallery[0] ?? '/images/project-ph-1.jpeg',
    title: project.title,
    tags: project.tags,
    projectLink: project.liveUrl ?? project.repoUrl ?? '#',
  }));

  const services: ServiceType[] = data.services.map((service) => ({
    title: service.title,
    desc: service.description ?? '',
    projects: service.price ?? '',
    icon: serviceIcon(service.icon),
  }));

  return {
    hero,
    stats: toStats(home.stats, fallbackStats),
    about: {
      bio: strArray(about.bio, fallbackAbout.bio),
      highlights: strArray(about.highlights, fallbackAbout.highlights),
    },
    contact: {
      email: str(contact.email, fallbackContact.email),
      phone: str(contact.phone, fallbackContact.phone),
      location: str(contact.location, fallbackContact.location),
    },
    projects: projects.length > 0 ? projects : fallbackProjects,
    services: services.length > 0 ? services : fallbackServices,
    education: educationItems.length > 0 ? educationItems : fallbackEducation,
    experience: workItems.length > 0 ? workItems : fallbackExperience,
    tools: tools.length > 0 ? tools : fallbackTools,
    navLinks: toNav(data.nav.header, fallbackNav),
    socialLinks: toSocial(data.nav.social, fallbackSocial),
    testimonials: fallbackTestimonials,
    settings: {
      name: str(site.name, FALLBACK_SITE.name),
      title: str(site.title, FALLBACK_SITE.title),
      description: str(site.description, FALLBACK_SITE.description),
      accentColor: str(site.accentColor, FALLBACK_SITE.accentColor),
      footerNote: str(site.footerNote, FALLBACK_SITE.footerNote),
      ogImage: str(site.ogImage, FALLBACK_SITE.ogImage),
    },
  };
};
