export interface LandingPageData {
  id: string;
  headline: string;
  subtext: string;
  ctaText: string;
  secondaryCtaText?: string;
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
  };
  trustSection: {
    clients: string[];
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
  };

  imageUrl?: string; // optional image to show in rich results
  sku?: string;      // if you want a stable id for the "product/service"
}

export interface LandingPageProps {
  data: LandingPageData;
}
