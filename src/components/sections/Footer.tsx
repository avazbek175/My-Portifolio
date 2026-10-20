/**
 * @copyright 2025 cyberavaz
 * @license Apache-2.0
 */

import { useSiteContent } from '@/context/ContentContext.hooks';

export const Footer = () => {
  const { navLinks, socialLinks, settings } = useSiteContent();
  const year = new Date().getFullYear();

  return (
    <footer className='border-t border-border py-10'>
      <div className='flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-between'>
        <a href='#hero' className='group flex items-center gap-2'>
          <span className='flex size-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground transition-transform group-hover:scale-105'>
            {settings.name.charAt(0).toUpperCase()}
          </span>
          <span className='text-base font-semibold text-foreground transition-colors group-hover:text-primary'>
            {settings.name}
          </span>
        </a>

        <nav className='flex flex-wrap items-center justify-center gap-x-6 gap-y-2'>
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.link}
              className='text-sm text-muted-foreground transition-colors hover:text-primary'
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className='flex gap-2.5'>
          {socialLinks.map((social) => {
            const Icon = social.icon;

            return (
              <a
                key={social.label}
                href={social.link}
                aria-label={social.label}
                target='_blank'
                rel='noreferrer noopener'
                className='flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-all hover:border-primary hover:text-primary'
              >
                <Icon className='size-4' />
              </a>
            );
          })}
        </div>
      </div>

      <div className='mt-8 flex flex-col items-center gap-2 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:justify-between'>
        <p>
          © {year} {settings.name}. All rights reserved.
        </p>
        <p>
          Built with React, TypeScript &amp; Tailwind CSS — deployed on Vercel.
        </p>
      </div>
    </footer>
  );
};
