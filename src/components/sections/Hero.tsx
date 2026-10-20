/**
 * @copyright 2025 cyberavaz
 * @license Apache-2.0
 */

import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/Reveal';

import { ArrowDownToLine, ArrowRight, Mail } from 'lucide-react';

import { useSiteContent } from '@/context/ContentContext.hooks';

export const Hero = () => {
  const { hero, socialLinks, stats, settings } = useSiteContent();

  return (
    <section
      id='hero'
      className='relative scroll-mt-24 overflow-hidden pt-28 pb-16 sm:pt-32 lg:pt-36'
    >
      <div
        aria-hidden
        className='pointer-events-none absolute -top-40 left-1/2 -z-10 size-[32rem] -translate-x-1/2 rounded-full bg-primary/10 blur-[140px]'
      />

      <div className='grid items-center gap-12 lg:grid-cols-5'>
        <div className='lg:col-span-3'>
          <Reveal>
            <span className='inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground'>
              <span className='relative flex size-2'>
                <span className='absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75' />
                <span className='relative inline-flex size-2 rounded-full bg-primary' />
              </span>
              {hero.badge}
            </span>
          </Reveal>

          <Reveal delay={80}>
            <p className='mt-7 text-lg text-muted-foreground sm:text-xl'>
              {hero.greeting}
            </p>
          </Reveal>

          <Reveal delay={140}>
            <h1 className='mt-1 text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-6xl lg:text-7xl'>
              {hero.name}
            </h1>
          </Reveal>

          <Reveal delay={200}>
            <h2 className='mt-3 text-2xl font-semibold tracking-tight text-primary sm:text-3xl lg:text-4xl'>
              {hero.role}
            </h2>
          </Reveal>

          <Reveal delay={260}>
            <p className='mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg'>
              {hero.description}
            </p>
          </Reveal>

          <Reveal delay={320}>
            <div className='mt-9 flex flex-wrap items-center gap-4'>
              <Button
                size='lg'
                className='rounded-full px-7'
                onClick={() =>
                  document
                    .querySelector('#projects')
                    ?.scrollIntoView({ behavior: 'smooth' })
                }
              >
                View My Work
                <ArrowRight />
              </Button>

              <Button
                size='lg'
                variant='outline'
                className='rounded-full px-7'
                onClick={() =>
                  document
                    .querySelector('#contact')
                    ?.scrollIntoView({ behavior: 'smooth' })
                }
              >
                <Mail />
                Contact Me
              </Button>
            </div>
          </Reveal>

          <Reveal delay={380}>
            <div className='mt-9 flex items-center gap-3'>
              {socialLinks.map((social) => {
                const Icon = social.icon;

                return (
                  <a
                    key={social.label}
                    href={social.link}
                    aria-label={social.label}
                    target='_blank'
                    rel='noreferrer noopener'
                    className='flex size-11 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-all hover:border-primary hover:text-primary'
                  >
                    <Icon className='size-5' />
                  </a>
                );
              })}
            </div>
          </Reveal>
        </div>

        <div className='lg:col-span-2'>
          <Reveal delay={220} className='relative mx-auto w-full max-w-sm'>
            <div className='relative overflow-hidden rounded-3xl border border-border bg-card p-3 shadow-2xl shadow-primary/5'>
              <img
                src='/avatar.jpg'
                alt={`${settings.name} portrait`}
                width={640}
                height={640}
                className='aspect-square w-full rounded-2xl object-cover'
              />
              <div className='absolute right-6 top-6 rounded-full border border-border bg-background/80 px-4 py-2 text-xs font-medium text-foreground backdrop-blur'>
                Tashkent, UZ
              </div>
            </div>

            <div className='absolute -bottom-6 -left-6 hidden rounded-2xl border border-border bg-background/90 px-5 py-4 backdrop-blur sm:block'>
              <div className='flex items-center gap-3 text-sm'>
                <ArrowDownToLine className='size-4 text-primary' />
                <span className='text-muted-foreground'>Scroll to explore</span>
              </div>
            </div>
          </Reveal>
        </div>
      </div>

      <div className='mt-16 grid grid-cols-1 gap-4 sm:grid-cols-3'>
        {stats.map((stat, index) => (
          <Reveal key={stat.label} delay={index * 100}>
            <div className='flex items-center justify-between rounded-2xl border border-border bg-card px-6 py-5 transition-colors hover:border-primary/40'>
              <span className='text-3xl font-bold text-foreground sm:text-4xl'>
                {stat.number}
              </span>
              <span className='max-w-[8rem] text-right text-sm text-muted-foreground'>
                {stat.label}
              </span>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
};
