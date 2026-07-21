import { useEffect } from 'react';
import Problem from '../Problem';
import Hero from '../Hero';
import Services from '../Services';
import Process from '../Process';
import Projects from '../Projects/Projects';
import CtaSection from '../CtaSection';
import { generateOrganizationSchema, addJsonLd } from '../../lib/seo';

export default function Home() {
  useEffect(() => {
    const schema = generateOrganizationSchema();
    addJsonLd(schema, 'localbusiness');

    return () => {
      const existing = document.querySelector('script[data-jsonld-id="localbusiness"]');
      if (existing) {
        existing.remove();
      }
    };
  }, []);

  return (
    <>
      <Hero />
      <Problem />
      <Services />
      <Projects />
      <Process />
      <CtaSection />
    </>
  );
}
