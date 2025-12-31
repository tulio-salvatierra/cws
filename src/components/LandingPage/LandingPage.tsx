import { useEffect } from 'react';
import { useModal } from '../LeadFormModal/ModalContext';
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
  const { openLeadForm } = useModal();
  
  // Handle SEO meta tags and structured data
  useLandingPageSEO(data);

  // Auto-open lead form modal when landing page mounts
  useEffect(() => {
    // Ensure we're at the top of the page
    if (window.scrollY > 0) {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
    
    // Open modal after a brief delay to ensure page is ready
    const timer = setTimeout(() => {
      openLeadForm();
    }, 50);
    
    return () => clearTimeout(timer);
  }, [openLeadForm]);

  const scrollToContact = () => {
    const contactSection = document.getElementById('contact-form');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
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
