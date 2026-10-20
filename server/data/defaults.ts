/**
 * Default content used to seed a fresh database.
 *
 * Seeding only runs when a table is empty, so it never overwrites existing
 * content or deletes user data.
 */

export const defaultSettings = {
  site: {
    name: 'Avazbek',
    title: 'CYBERAVAZ | Frontend Designer & Developer',
    description:
      'I design and build modern, high-performance web interfaces with React, TypeScript and Tailwind CSS.',
    accentColor: '#4ade80',
    fontFamily: "'Syne', sans-serif",
    defaultTheme: 'dark',
    ogImage: '/avatar.jpg',
    footerNote: 'Built with React, TypeScript & Tailwind CSS.',
  },
};

export const defaultPages = [
  {
    id: 'home',
    title: 'Home',
    seoTitle: 'CYBERAVAZ | Frontend Designer & Developer',
    seoDescription:
      'Portfolio of Avazbek — frontend designer & developer building fast, accessible web experiences.',
    content: {
      badge: 'Available for freelance work',
      greeting: "Hi, I'm",
      name: 'Avazbek',
      role: 'Frontend Designer & Developer',
      description:
        'I design and build modern, high-performance web interfaces with React, TypeScript, Tailwind and a strong focus on accessibility and detail.',
      primaryCta: { label: 'View My Work', href: '#projects' },
      secondaryCta: { label: 'Contact Me', href: '#contact' },
      stats: [
        { number: '30+', label: 'Happy Clients' },
        { number: '05+', label: 'Years Of Experience' },
        { number: '50+', label: 'Projects Done' },
      ],
    },
  },
  {
    id: 'about',
    title: 'About',
    seoTitle: 'About — Avazbek',
    seoDescription:
      'Frontend developer and designer focused on accessible, high-performance interfaces.',
    content: {
      title: 'Turning ideas into interfaces',
      description:
        'A quick look at who I am, how I work and the tools I reach for every day.',
      bio: [
        'I am a frontend developer and designer passionate about building clean, accessible and performant web interfaces with React, TypeScript and Tailwind CSS.',
        'I care about design systems, interaction details and shipping products that feel fast and delightful to use.',
      ],
      highlights: [
        'Responsive, accessible interfaces',
        'Design systems & component libraries',
        'Performance and Core Web Vitals',
        'Full-stack features with Node.js',
      ],
    },
  },
  {
    id: 'contact',
    title: 'Contact',
    seoTitle: 'Contact — Avazbek',
    seoDescription: 'Get in touch with Avazbek for freelance projects and collaboration.',
    content: {
      title: 'Let’s work together',
      description:
        'Have a project, a role or just an idea? Send me a message and I’ll get back to you shortly.',
      email: 'avazbek.bug@gmail.com',
      phone: '+998 90 000 00 00',
      location: 'Tashkent, Uzbekistan',
    },
  },
];

export const defaultNavLinks = [
  { label: 'Home', href: '#hero', location: 'header', sortOrder: 0, visible: true, external: false },
  { label: 'Projects', href: '#projects', location: 'header', sortOrder: 1, visible: true, external: false },
  { label: 'About', href: '#about', location: 'header', sortOrder: 2, visible: true, external: false },
  { label: 'Services', href: '#services', location: 'header', sortOrder: 3, visible: true, external: false },
  { label: 'Resume', href: '#resume', location: 'header', sortOrder: 4, visible: true, external: false },
  { label: 'Reviews', href: '#testimonials', location: 'header', sortOrder: 5, visible: true, external: false },
  { label: 'Contact', href: '#contact', location: 'header', sortOrder: 6, visible: true, external: false },
  { label: 'GitHub', href: 'https://github.com/avazbek175', location: 'social', sortOrder: 0, visible: true, external: true },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/', location: 'social', sortOrder: 1, visible: true, external: true },
  { label: 'Twitter', href: 'https://twitter.com/', location: 'social', sortOrder: 2, visible: true, external: true },
  { label: 'Instagram', href: 'https://www.instagram.com/', location: 'social', sortOrder: 3, visible: true, external: true },
];

export const defaultSkills = [
  { name: 'React', category: 'Frontend', icon: '/images/tools/react.svg', proficiency: 92, sortOrder: 0 },
  { name: 'TypeScript', category: 'Frontend', icon: '', proficiency: 88, sortOrder: 1 },
  { name: 'JavaScript', category: 'Frontend', icon: '/images/tools/javascript.svg', proficiency: 93, sortOrder: 2 },
  { name: 'Tailwind CSS', category: 'Frontend', icon: '/images/tools/tailwindcss.svg', proficiency: 90, sortOrder: 3 },
  { name: 'CSS', category: 'Frontend', icon: '/images/tools/css3.svg', proficiency: 90, sortOrder: 4 },
  { name: 'Node.js', category: 'Backend', icon: '/images/tools/nodejs.svg', proficiency: 80, sortOrder: 5 },
  { name: 'Express.js', category: 'Backend', icon: '/images/tools/expressjs.svg', proficiency: 78, sortOrder: 6 },
  { name: 'MongoDB', category: 'Backend', icon: '/images/tools/mongodb.svg', proficiency: 75, sortOrder: 7 },
  { name: 'Figma', category: 'Design', icon: '/images/tools/figma.svg', proficiency: 85, sortOrder: 8 },
];

export const defaultExperiences = [
  {
    kind: 'education',
    company: 'University / Self-taught',
    position: 'Computer Science & Web Development',
    period: '2019 — 2023',
    description:
      'Studied computer science fundamentals while building web projects, focusing on modern frontend engineering.',
    link: null,
    sortOrder: 0,
  },
  {
    kind: 'work',
    company: 'Freelance',
    position: 'Frontend Developer & Designer',
    period: '2022 — Present',
    description:
      'Designing and building responsive web interfaces for startups and clients using React, TypeScript and Tailwind CSS.',
    link: null,
    sortOrder: 1,
  },
];

export const defaultServices = [
  {
    title: 'UI/UX Design',
    description:
      'Designing clean, intuitive interfaces that improve user experience and conversions.',
    icon: 'layers',
    price: null,
    sortOrder: 0,
  },
  {
    title: 'Frontend Development',
    description:
      'Building fast, accessible and responsive web applications with React and TypeScript.',
    icon: 'code',
    price: null,
    sortOrder: 1,
  },
  {
    title: 'Landing Pages',
    description:
      'High-converting marketing pages with smooth animations and strong Core Web Vitals.',
    icon: 'globe',
    price: null,
    sortOrder: 2,
  },
  {
    title: 'Design Systems',
    description:
      'Reusable component libraries and design tokens that keep products consistent.',
    icon: 'palette',
    price: null,
    sortOrder: 3,
  },
];

export const defaultProjects = [
  {
    slug: 'full-stack-music-app',
    title: 'Full Stack Music App',
    summary: 'A music streaming experience with playlists, search and playback.',
    description:
      'A full-stack music application featuring authentication, playlists, search and audio playback. Built with React on the frontend and Node/Express with MongoDB on the backend.',
    coverUrl: '/images/project-ph-1.jpeg',
    gallery: ['/images/project-ph-1.jpeg'],
    category: 'Web App',
    tags: ['React', 'Node.js', 'MongoDB'],
    repoUrl: 'https://github.com/avazbek175',
    liveUrl: 'https://musify-5al0.onrender.com/',
    featured: true,
    status: 'published',
    sortOrder: 0,
  },
  {
    slug: 'portfolio-website',
    title: 'Developer Portfolio',
    summary: 'A fast, accessible portfolio with a custom admin CMS.',
    description:
      'A personal portfolio built with React, TypeScript, Vite and Tailwind CSS, including a full content management system with authentication and a media library.',
    coverUrl: '/images/project-ph-2.jpeg',
    gallery: ['/images/project-ph-2.jpeg'],
    category: 'Website',
    tags: ['React', 'TypeScript', 'Tailwind CSS'],
    repoUrl: 'https://github.com/avazbek175/My-Portifolio',
    liveUrl: null,
    featured: true,
    status: 'published',
    sortOrder: 1,
  },
  {
    slug: 'dashboard-ui',
    title: 'Analytics Dashboard UI',
    summary: 'A modern analytics dashboard with charts and dark mode.',
    description:
      'A responsive analytics dashboard interface with data visualisation, filters and a polished dark theme.',
    coverUrl: '/images/project-ph-3.jpeg',
    gallery: ['/images/project-ph-3.jpeg'],
    category: 'UI Kit',
    tags: ['React', 'Tailwind CSS'],
    repoUrl: null,
    liveUrl: null,
    featured: false,
    status: 'published',
    sortOrder: 2,
  },
  {
    slug: 'ecommerce-storefront',
    title: 'E-commerce Storefront',
    summary: 'A product catalogue with cart and checkout flow.',
    description:
      'An e-commerce storefront with product listings, cart, and a responsive checkout flow.',
    coverUrl: '/images/project-ph-4.jpeg',
    gallery: ['/images/project-ph-4.jpeg'],
    category: 'E-commerce',
    tags: ['React', 'Express.js'],
    repoUrl: null,
    liveUrl: null,
    featured: false,
    status: 'draft',
    sortOrder: 3,
  },
];
