/**
 * @copyright 2025 cyberavaz
 * @license Apache-2.0
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/Reveal';
import { SectionHeading } from '@/components/SectionHeading';

import { CheckCircle2, Mail, MapPin, Phone, Send } from 'lucide-react';

import { apiFetch } from '@/lib/api';
import { useSiteContent } from '@/context/ContentContext.hooks';

const contactSchema = z.object({
  name: z.string().min(2, 'Please enter your name'),
  email: z.email('Please enter a valid email address'),
  subject: z.string().min(3, 'Please add a subject'),
  message: z.string().min(10, 'Message should be at least 10 characters'),
});

type ContactValues = z.infer<typeof contactSchema>;

export const Contact = () => {
  const { contact: contactInfo, socialLinks } = useSiteContent();
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const contactDetails = [
    {
      icon: Mail,
      label: 'Email',
      value: contactInfo.email,
      href: `mailto:${contactInfo.email}`,
    },
    {
      icon: Phone,
      label: 'Phone',
      value: contactInfo.phone,
      href: `tel:${contactInfo.phone.replace(/\s/g, '')}`,
    },
    {
      icon: MapPin,
      label: 'Location',
      value: contactInfo.location,
      href: undefined,
    },
  ];

  const form = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: '', email: '', subject: '', message: '' },
    mode: 'onBlur',
  });

  const onSubmit = async (values: ContactValues) => {
    setStatus('idle');
    setErrorMessage(null);
    try {
      await apiFetch('/api/public/contact', { method: 'POST', body: values });
      setStatus('success');
      form.reset();
    } catch (cause) {
      setStatus('error');
      setErrorMessage(
        cause instanceof Error ? cause.message : 'Unable to send your message',
      );
    }
  };

  return (
    <section id='contact' className='scroll-mt-24 py-16 sm:py-20'>
      <SectionHeading
        eyebrow='Contact'
        title='Let’s work together'
        description='Have a project, a role or just an idea? Send me a message and I’ll get back to you shortly.'
      />

      <div className='mt-14 grid gap-8 lg:grid-cols-5 lg:gap-10'>
        <Reveal className='lg:col-span-2'>
          <div className='flex h-full flex-col gap-6 rounded-2xl border border-border bg-card p-6 sm:p-8'>
            <div>
              <h3 className='text-xl font-semibold text-foreground'>
                Get in touch
              </h3>
              <p className='mt-2 text-sm leading-relaxed text-muted-foreground'>
                Fill in the form or reach me directly through the details
                below. I usually reply within a day.
              </p>
            </div>

            <ul className='space-y-4'>
              {contactDetails.map((detail) => {
                const Icon = detail.icon;

                const content = (
                  <span className='flex items-center gap-4 rounded-xl border border-border bg-background px-4 py-3.5 transition-colors group-hover:border-primary/50'>
                    <span className='flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary'>
                      <Icon className='size-5' />
                    </span>
                    <span className='min-w-0'>
                      <span className='block text-xs uppercase tracking-wider text-muted-foreground'>
                        {detail.label}
                      </span>
                      <span className='block truncate text-sm font-medium text-foreground'>
                        {detail.value}
                      </span>
                    </span>
                  </span>
                );

                return (
                  <li key={detail.label} className='group'>
                    {detail.href ? (
                      <a href={detail.href} className='block'>
                        {content}
                      </a>
                    ) : (
                      content
                    )}
                  </li>
                );
              })}
            </ul>

            <div className='mt-auto'>
              <p className='text-sm font-medium text-foreground'>Follow me</p>
              <div className='mt-3 flex gap-3'>
                {socialLinks.map((social) => {
                  const Icon = social.icon;

                  return (
                    <a
                      key={social.label}
                      href={social.link}
                      aria-label={social.label}
                      target='_blank'
                      rel='noreferrer noopener'
                      className='flex size-10 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-all hover:border-primary hover:text-primary'
                    >
                      <Icon className='size-4' />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={120} className='lg:col-span-3'>
          <div className='rounded-2xl border border-border bg-card p-6 sm:p-8'>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className='grid grid-cols-1 gap-5 sm:grid-cols-2'
                noValidate
              >
                <FormField
                  control={form.control}
                  name='name'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder='Your name' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='email'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type='email'
                          placeholder='you@example.com'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='subject'
                  render={({ field }) => (
                    <FormItem className='sm:col-span-2'>
                      <FormLabel>Subject</FormLabel>
                      <FormControl>
                        <Input placeholder='Project inquiry' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='message'
                  render={({ field }) => (
                    <FormItem className='sm:col-span-2'>
                      <FormLabel>Message</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={5}
                          placeholder='Tell me a little about your project…'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className='flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center'>
                  <Button
                    type='submit'
                    size='lg'
                    className='w-full rounded-full px-7 sm:w-auto'
                    disabled={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting ? 'Sending…' : 'Send Message'}
                    <Send />
                  </Button>

                  {status === 'success' && (
                    <span className='flex items-center gap-2 text-sm text-primary'>
                      <CheckCircle2 className='size-4' />
                      Thanks! Your message has been sent.
                    </span>
                  )}

                  {status === 'error' && (
                    <span className='text-sm text-destructive'>
                      {errorMessage}
                    </span>
                  )}
                </div>
              </form>
            </Form>
          </div>
        </Reveal>
      </div>
    </section>
  );
};
