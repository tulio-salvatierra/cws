import { useEffect, useRef } from 'react';
import Problem from '../Problem';
import Hero from '../Hero';
import Services from '../Services';
import Process from '../Process';
import Projects from '../Projects/Projects';
import CtaSection from '../CtaSection';
import { generateOrganizationSchema, addJsonLd } from '../../lib/seo';

export default function Home() {
  const homeRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Add LocalBusiness schema with aggregate rating for homepage
    const schema = generateOrganizationSchema();
    addJsonLd(schema, 'localbusiness');
    
    return () => {
      // Cleanup on unmount
      const existing = document.querySelector('script[data-jsonld-id="localbusiness"]');
      if (existing) {
        existing.remove();
      }
    };
  }, []);

  return (
    <>
      <div>
        <Hero />
      </div>
      <div>
        <Problem />
      </div>
      <div>
      </div>
      <div className="h-auto">
        <Services />
      </div>
      <div className="h-auto">
        <Projects />
      </div>
      <div>
        <Process />
      </div>
      <div>
        <CtaSection />
      </div>
    </>
  );
}
