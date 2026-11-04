import { useRef } from 'react';
import Problem from '../Problem';
import Hero from '../Hero';
import Services from '../Services';
import Process from '../Process';
import Projects from '../Projects/Projects';
import CtaSection from '../CtaSection';

// LocalBusiness JSON-LD is added once, site-wide, by Layout.
export default function Home() {
  const homeRef = useRef<HTMLDivElement>(null);

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
