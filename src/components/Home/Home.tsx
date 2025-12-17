import Problem from '../Problem';
import Hero from '../Hero';
import Services from '../Services';
import Projects from '../Projects/Projects';
import Contact from '../Contact';
import Banner from '../Banner/Banner';
import How from '../How/How';
export default function Home() {
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
