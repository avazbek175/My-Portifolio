/**
 * @copyright 2025 cyberavaz
 * @license Apache-2.0
 */

import { Reveal } from '@/components/Reveal';
import { SectionHeading } from '@/components/SectionHeading';

import { Quote, Star } from 'lucide-react';

import { testimonials } from '@/constants';

export const Testimonials = () => {
  return (
    <section id='testimonials' className='scroll-mt-24 py-16 sm:py-20'>
      <SectionHeading
        eyebrow='Reviews'
        title='What people say'
        description='Feedback from the founders, managers and teams I have worked with.'
      />

      <div className='mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
        {testimonials.map((testimonial, index) => (
          <Reveal key={testimonial.name} delay={index * 90}>
            <figure className='relative flex h-full flex-col rounded-2xl border border-border bg-card p-7 transition-all hover:-translate-y-1 hover:border-primary/40'>
              <Quote className='absolute right-6 top-6 size-8 text-primary/15' />

              <div className='flex gap-1 text-primary'>
                {Array.from({ length: 5 }).map((_, starIndex) => (
                  <Star
                    key={starIndex}
                    className='size-4 fill-current'
                    aria-hidden
                  />
                ))}
              </div>

              <blockquote className='mt-5 flex-1 text-sm leading-relaxed text-muted-foreground'>
                &ldquo;{testimonial.text}&rdquo;
              </blockquote>

              <figcaption className='mt-6 flex items-center gap-4 border-t border-border pt-5'>
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  loading='lazy'
                  width={44}
                  height={44}
                  className='size-11 rounded-full object-cover'
                />
                <div className='min-w-0'>
                  <p className='truncate text-sm font-semibold text-foreground'>
                    {testimonial.name}
                  </p>
                  <p className='truncate text-xs text-muted-foreground'>
                    {testimonial.role}
                  </p>
                </div>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  );
};
