/**
 * @copyright 2025 cyberavaz
 * @license Apache-2.0
 */

import { Reveal } from '@/components/Reveal';
import { cn } from '@/lib/utils';

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description?: string;
  align?: 'center' | 'start';
  className?: string;
};

export const SectionHeading = ({
  eyebrow,
  title,
  description,
  align = 'center',
  className,
}: SectionHeadingProps) => {
  return (
    <Reveal className={cn(align === 'center' && 'text-center', className)}>
      <span className='inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-primary'>
        <span className='size-1.5 rounded-full bg-primary' />
        {eyebrow}
      </span>

      <h2 className='mt-6 text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl'>
        {title}
      </h2>

      {description && (
        <p
          className={cn(
            'mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base',
            align === 'center' && 'mx-auto',
          )}
        >
          {description}
        </p>
      )}
    </Reveal>
  );
};
