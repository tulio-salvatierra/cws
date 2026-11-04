import { useEffect } from 'react';
import { LandingPageData } from '../types/landingPage';
import { buildServiceJsonLd } from '../lib/jsonld';
import { addJsonLd } from '../lib/seo';

export function useLandingPageSEO(data: LandingPageData) {
  useEffect(() => {
    // Set page title
    document.title = data.meta.title;
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', data.meta.description);
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = data.meta.description;
      document.head.appendChild(meta);
    }

    addJsonLd(buildServiceJsonLd(data), 'landing-service');

    return () => {
      document.querySelector('script[data-jsonld-id="landing-service"]')?.remove();
    };
  }, [data]);
}
