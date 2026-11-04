import { LandingPageData } from '../types/landingPage';

export function buildReviewJsonLd(page: LandingPageData) {
  const type = page.itemReviewedType || 'Service';
  const obj: any = {
    '@context': 'https://schema.org',
    '@type': type,
    name: page.serviceType || page.headline,
    description: page.meta?.description || page.subtext,
    areaServed: page.localHook?.areas,
  };

  if (page.imageUrl) obj.image = page.imageUrl;

  // Offers (use numeric starting price if provided)
  if (page.priceNumberUSD) {
    obj.offers = {
      '@type': 'Offer',
      priceCurrency: 'USD',
      price: page.priceNumberUSD,
      availability: 'http://schema.org/InStock'
    };
  }

  // No aggregateRating/review here on purpose: the per-page rating and review
  // data in landingPagesData isn't backed by real, verifiable reviews, and
  // publishing it as structured data risks a Google manual action.

  return JSON.stringify(obj);
}
