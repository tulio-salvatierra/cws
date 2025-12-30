import { useEffect } from 'react';
import { useModal } from '../LeadFormModal/ModalContext';
import { LandingPageProps } from '../../types/landingPage';
import { useLandingPageSEO } from '../../Hooks/useLandingPageSEO';
import LandingPageHero from './LandingPageHero';
import ProblemStatementSection from './ProblemStatementSection';
import SolutionSection from './SolutionSection';
import TrustSection from './TrustSection';
import HowItWorksSection from './HowItWorksSection';
import LocalHookSection from './LocalHookSection';
import LandingPageContactForm from './LandingPageContactForm';

export default function LandingPage({ data }: LandingPageProps) {
  const { openLeadForm } = useModal();
  
  // Handle SEO meta tags and structured data
  useLandingPageSEO(data);

  // Auto-open lead form modal when landing page mounts
  useEffect(() => {
    openLeadForm();
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
      <TrustSection data={data} />
      <HowItWorksSection data={data} />
      <LocalHookSection data={data} />
      <LandingPageContactForm data={data} />
    </div>
  );
}
