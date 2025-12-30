import { useEffect } from 'react';
import Problem from '../Problem';
import Hero from '../Hero';
import Services from '../Services';
import Projects from '../Projects/Projects';
import Contact from '../Contact';
import Banner from '../Banner/Banner';
import How from '../How/How';
import { generateOrganizationSchema, addJsonLd } from '../../lib/seo';

export default function Home() {
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
      <div>
        <How />
      </div>
      <div className="h-auto">
        <Projects />
      </div>        
      <div>
        <Contact />
      </div>
    </>
  );
}
