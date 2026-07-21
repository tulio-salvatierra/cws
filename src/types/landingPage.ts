export type LandingPageReview = {
  author: string;
  ratingValue: number; // 1–5
  body: string;
  datePublished?: string; // ISO
};

export type LandingPageRating = {
  ratingValue: number;   // average, e.g., 4.9
  reviewCount: number;   // total count
};

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
    startingPrice: string;
  };
  trustSection: {
    clients: string[];
    testimonial: {
      text: string;
      author: string;
      business?: string;
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

  // NEW (optional)
  itemReviewedType?: 'Service' | 'Product';
  rating?: LandingPageRating;
  reviews?: LandingPageReview[];
  imageUrl?: string; // optional image to show in rich results
  sku?: string;      // if you want a stable id for the "product/service"
  priceNumberUSD?: number; // numeric "starting at" for Offer.price
}

export interface LandingPageProps {
  data: LandingPageData;
}
