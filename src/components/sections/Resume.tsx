/**
 * @copyright 2025 cyberavaz
 * @license Apache-2.0
 */

import { Reveal } from '@/components/Reveal';
import { SectionHeading } from '@/components/SectionHeading';

import { GraduationCap, Briefcase } from 'lucide-react';

import { useSiteContent } from '@/context/ContentContext.hooks';
import type { ReactNode } from 'react';
import type { ExperienceType } from '@/types';

type TimelineProps = {
  title: string;
  icon: ReactNode;
  items: ExperienceType[];
};

const Timeline = ({ title, icon, items }: TimelineProps) => (
  <div className='rounded-2xl border border-border bg-card p-6 sm:p-8'>
    <div className='flex items-center gap-3'>
      <span className='flex size-10 items-center justify-center rounded-xl border border-border bg-background text-primary'>
        {icon}
      </span>
      <h3 className='text-lg font-semibold text-foreground'>{title}</h3>
    </div>

    <ol className='mt-8 space-y-8'>
      {items.map((item) => (
        <li key={`${title}-${item.year}`} className='relative pl-7'>
          <span className='absolute left-0 top-1.5 size-3 rounded-full border-2 border-primary bg-background' />
          <span
            aria-hidden
            className='absolute left-[5px] top-5 h-full w-px bg-border'
          />

          <span className='inline-block rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-primary'>
            {item.year}
          </span>

          <h4 className='mt-3 text-base font-semibold text-foreground'>
            {item.title}
          </h4>
          <p className='text-sm text-muted-foreground'>{item.institute}</p>
          <p className='mt-2 text-sm leading-relaxed text-muted-foreground'>
            {item.desc}
          </p>
        </li>
      ))}
    </ol>
  </div>
);

export const Resume = () => {
  const { education, experience } = useSiteContent();

  return (
    <section id='resume' className='scroll-mt-24 py-16 sm:py-20'>
      <SectionHeading
        eyebrow='My Journey'
        title='Resume & Experience'
        description='The education, bootcamps and roles that shaped how I build today.'
      />

      <div className='mt-14 grid gap-6 lg:grid-cols-2'>
        <Reveal>
          <Timeline
            title='Education'
            icon={<GraduationCap className='size-5' />}
            items={education}
          />
        </Reveal>

        <Reveal delay={120}>
          <Timeline
            title='Experience'
            icon={<Briefcase className='size-5' />}
            items={experience}
          />
        </Reveal>
      </div>
    </section>
  );
};
