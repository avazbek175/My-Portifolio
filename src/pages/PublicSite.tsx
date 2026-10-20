import { Sidebar } from '@/components/Sidebar';
import { Hero } from '@/components/sections/Hero';
import { Projects } from '@/components/sections/Projects';
import { About } from '@/components/sections/About';
import { Services } from '@/components/sections/Services';
import { Resume } from '@/components/sections/Resume';
import { Testimonials } from '@/components/sections/Testimonials';
import { Contact } from '@/components/sections/Contact';
import { Footer } from '@/components/sections/Footer';

export const PublicSite = () => {
  return (
    <div className='relative min-h-screen overflow-x-hidden'>
      <Sidebar />
      <main className='mx-auto w-full min-w-0 max-w-6xl px-5 sm:px-8 lg:px-10'>
        <Hero />
        <Projects />
        <About />
        <Services />
        <Resume />
        <Testimonials />
        <Contact />
        <Footer />
      </main>
    </div>
  );
};
