/**
 * @copyright 2025 cyberavaz
 * @license Apache-2.0
 */

import { Reveal } from '@/components/Reveal';
import { SectionHeading } from '@/components/SectionHeading';

import { useSiteContent } from '@/context/ContentContext.hooks';

export const Services = () => {
  const { services } = useSiteContent();

  return (
    <section id='services' className='scroll-mt-24 py-16 sm:py-20'>
      <SectionHeading
        eyebrow='What I Do'
        title='Services I offer'
        description='End-to-end design and development support, tailored to startups, teams and independent founders.'
      />

      <div className='mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3'>
        {services.map((service, index) => (
          <Reveal
            key={service.title}
            delay={index * 70}
            className={index === services.length - 1 ? 'lg:col-span-1' : ''}
          >
            <article className='group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card p-7 transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10'>
              <span className='pointer-events-none absolute right-6 top-6 text-5xl font-bold text-foreground/[0.03] transition-colors group-hover:text-primary/10'>
                0{index + 1}
              </span>

              <div className='flex size-12 items-center justify-center rounded-xl border border-border bg-background text-primary transition-colors group-hover:border-primary/60 group-hover:bg-primary group-hover:text-primary-foreground'>
                {service.icon}
              </div>

              <h3 className='mt-6 text-xl font-semibold text-foreground transition-colors group-hover:text-primary'>
                {service.title}
              </h3>

              <p className='mt-3 flex-1 text-sm leading-relaxed text-muted-foreground'>
                {service.desc}
              </p>

              <div className='mt-6 border-t border-border pt-4'>
                <span className='text-xs font-medium uppercase tracking-wider text-primary'>
                  {service.projects}
                </span>
              </div>
            </article>
          </Reveal>
        ))}

        <Reveal delay={services.length * 70} className='sm:col-span-2 lg:col-span-2'>
          <div className='flex h-full flex-col justify-between gap-6 rounded-2xl border border-primary/30 bg-primary/5 p-7 sm:flex-row sm:items-center'>
            <div>
              <h3 className='text-xl font-semibold text-foreground'>
                Have a project in mind?
              </h3>
              <p className='mt-2 text-sm text-muted-foreground'>
                Let&apos;s talk about what we can build together.
              </p>
            </div>

            <a
              href='#contact'
              className='inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105'
            >
              →
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
};
