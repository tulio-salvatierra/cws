import { LandingPageProps } from '../../types/landingPage';
import { useLandingPageSEO } from '../../Hooks/useLandingPageSEO';
import LandingPageHero from './LandingPageHero';
import ProblemStatementSection from './ProblemStatementSection';
import SolutionSection from './SolutionSection';
import TrustSection from './TrustSection';
import LocalHookSection from './LocalHookSection';
import LandingPageContactForm from './LandingPageContactForm';
import How from '../How/How';
import Reviews from '../Reviews/Reviews';

export default function LandingPage({ data }: LandingPageProps) {
  // Handle SEO meta tags and structured data
  useLandingPageSEO(data);

  const scrollToContact = () => {
    const contactSection = document.getElementById('contact-form');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen text-white">
      <LandingPageHero data={data} onCTAClick={scrollToContact} />
      <ProblemStatementSection data={data} />
      <SolutionSection data={data} />
      <Reviews />
      <TrustSection data={data} />
      <How />
      <LocalHookSection data={data} />
      <LandingPageContactForm data={data} />
    </div>
  );
}
