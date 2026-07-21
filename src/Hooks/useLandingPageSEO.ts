import { useEffect } from 'react';
import { LandingPageData } from '../types/landingPage';
import { buildReviewJsonLd } from '../lib/jsonld';

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

    // Update meta keywords
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) {
      metaKeywords.setAttribute('content', data.meta.keywords.join(', '));
    } else {
      const meta = document.createElement('meta');
      meta.name = 'keywords';
      meta.content = data.meta.keywords.join(', ');
      document.head.appendChild(meta);
    }

    // Add JSON-LD structured data for reviews
    const existingJsonLd = document.querySelector('script[type="application/ld+json"]');
    if (existingJsonLd) {
      existingJsonLd.remove();
    }

    const jsonLdScript = document.createElement('script');
    jsonLdScript.type = 'application/ld+json';
    jsonLdScript.textContent = buildReviewJsonLd(data);
    document.head.appendChild(jsonLdScript);

    // Cleanup function
    return () => {
      const jsonLd = document.querySelector('script[type="application/ld+json"]');
      if (jsonLd && jsonLd.textContent === buildReviewJsonLd(data)) {
        jsonLd.remove();
      }
    };
  }, [data]);
}

