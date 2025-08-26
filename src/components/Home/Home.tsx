import Problem from '../Problem';
import Hero from '../Hero';
import Services from '../Services';
import Projects from '../Projects/Projects';
import Contact from '../Contact';

export default function Home() {
  return (
    <>
      <div>
        <Hero />
      </div>
      <div>
        <Problem />
      </div>
      <div className="h-auto">
        <Services />
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
