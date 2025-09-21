export interface LandingPageData {
  id: string;
  headline: string;
  subtext: string;
  ctaText: string;
  localKeyword: string;
  serviceType: string;
  location: string;
  problemStatement: {
    title: string;
    description: string;
    painPoints: string[];
  };
  solution: {
    title: string;
    features: string[];
    startingPrice: string;
  };
  trustSection: {
    clients: string[];
    testimonial: {
      text: string;
      author: string;
      business: string;
    };
  };
  howItWorks: {
    title: string;
    steps: {
      number: string;
      title: string;
      description: string;
    }[];
  };
  localHook: {
    title: string;
    description: string;
    areas: string[];
  };
  meta: {
    title: string;
    description: string;
    keywords: string[];
  };
}

export interface LandingPageProps {
  data: LandingPageData;
}
