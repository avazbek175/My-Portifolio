/**
 * @copyright 2025 cyberavaz
 * @license Apache-2.0
 */

import { Reveal } from '@/components/Reveal';
import { SectionHeading } from '@/components/SectionHeading';

import { CheckCircle2 } from 'lucide-react';

import { useSiteContent } from '@/context/ContentContext.hooks';

export const About = () => {
  const { about, tools } = useSiteContent();

  return (
    <section id='about' className='scroll-mt-24 py-16 sm:py-20'>
      <SectionHeading
        eyebrow='About Me'
        title='Turning ideas into interfaces'
        description='A quick look at who I am, how I work and the tools I reach for every day.'
      />

      <div className='mt-14 grid gap-10 lg:grid-cols-2 lg:gap-16'>
        <Reveal className='flex flex-col justify-center'>
          <div className='space-y-5'>
            {about.bio.map((paragraph) => (
              <p
                key={paragraph.slice(0, 24)}
                className='text-base leading-relaxed text-muted-foreground sm:text-lg'
              >
                {paragraph}
              </p>
            ))}
          </div>

          <ul className='mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2'>
            {about.highlights.map((highlight) => (
              <li
                key={highlight}
                className='flex items-start gap-2.5 text-sm text-foreground'
              >
                <CheckCircle2 className='mt-0.5 size-4 shrink-0 text-primary' />
                {highlight}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={120}>
          <div className='rounded-2xl border border-border bg-card p-6 sm:p-8'>
            <h3 className='text-sm font-semibold uppercase tracking-[0.2em] text-primary'>
              Tools I use
            </h3>

            <div className='mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4'>
              {tools.map((tool) => (
                <div
                  key={tool.label}
                  className='group flex flex-col items-center gap-3 rounded-xl border border-border bg-background px-3 py-5 transition-colors hover:border-primary/50'
                >
                  <div className='flex size-12 items-center justify-center rounded-lg bg-background transition-transform duration-300 group-hover:-translate-y-1'>
                    <img
                      src={tool.imgSrc}
                      alt={tool.label}
                      loading='lazy'
                      className='size-7 object-contain'
                    />
                  </div>
                  <span className='text-center text-xs text-muted-foreground'>
                    {tool.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};
