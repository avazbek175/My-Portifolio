/**
 * Maps CMS string keys to lucide icons so content can control the UI.
 */

import type { JSX } from 'react';
import type { ElementType } from 'react';
import {
  Briefcase,
  Circle,
  Code,
  FileText,
  Github,
  Globe,
  Home,
  Instagram,
  Layers,
  Linkedin,
  Mail,
  MessageCircle,
  Palette,
  Rocket,
  Settings,
  Smartphone,
  Twitter,
  User,
} from 'lucide-react';

const SERVICE_ICONS: Record<string, ElementType> = {
  layers: Layers,
  code: Code,
  globe: Globe,
  palette: Palette,
  smartphone: Smartphone,
  rocket: Rocket,
  settings: Settings,
  briefcase: Briefcase,
};

const NAV_ICONS: Record<string, ElementType> = {
  home: Home,
  projects: Briefcase,
  about: User,
  services: Settings,
  resume: FileText,
  reviews: MessageCircle,
  testimonials: MessageCircle,
  contact: Mail,
};

const SOCIAL_ICONS: Record<string, ElementType> = {
  github: Github,
  linkedin: Linkedin,
  twitter: Twitter,
  x: Twitter,
  instagram: Instagram,
  website: Globe,
  globe: Globe,
};

export const serviceIcon = (key: string | null): JSX.Element => {
  const Icon = (key && SERVICE_ICONS[key.toLowerCase()]) || Layers;
  return <Icon className='h-6 w-6 text-primary' />;
};

export const navIcon = (label: string): ElementType =>
  NAV_ICONS[label.trim().toLowerCase()] ?? Circle;

export const socialIcon = (label: string): ElementType =>
  SOCIAL_ICONS[label.trim().toLowerCase()] ?? Globe;
