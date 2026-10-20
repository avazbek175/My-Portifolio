/**
 * @copyright 2025 cyberavaz
 * @license Apache-2.0
 */

import { Reveal } from '@/components/Reveal';
import { SectionHeading } from '@/components/SectionHeading';

import { ArrowUpRight, Folder } from 'lucide-react';

import { useSiteContent } from '@/context/ContentContext.hooks';

export const Projects = () => {
  const { projects } = useSiteContent();

  return (
    <section id='projects' className='scroll-mt-24 py-16 sm:py-20'>
      <SectionHeading
        eyebrow='Portfolio'
        title='Featured Projects'
        description='A selection of products I have designed and built end-to-end — from responsive web apps to full-stack platforms.'
      />

      <div className='mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2'>
        {projects.map((project, index) => (
          <Reveal key={project.title} delay={index * 90}>
            <a
              href={project.projectLink}
              target='_blank'
              rel='noreferrer noopener'
              className='group block h-full overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10'
            >
              <div className='relative aspect-[16/10] overflow-hidden bg-background'>
                <img
                  src={project.imgSrc}
                  alt={project.title}
                  loading='lazy'
                  className='size-full object-cover transition-transform duration-500 group-hover:scale-105'
                />
                <div className='absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100' />
              </div>

              <div className='flex items-start justify-between gap-4 p-6'>
                <div className='min-w-0'>
                  <div className='mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground'>
                    <Folder className='size-3.5 text-primary' />
                    {project.tags.join(' · ')}
                  </div>
                  <h3 className='truncate text-xl font-semibold text-foreground transition-colors group-hover:text-primary'>
                    {project.title}
                  </h3>
                </div>

                <span className='flex size-11 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-all group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground'>
                  <ArrowUpRight className='size-5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5' />
                </span>
              </div>
            </a>
          </Reveal>
        ))}
      </div>
    </section>
  );
};
