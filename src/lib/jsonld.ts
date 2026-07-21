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

  // Aggregate rating
  if (page.rating) {
    obj.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: page.rating.ratingValue.toString(),
      reviewCount: page.rating.reviewCount.toString()
    };
  }

  // Individual reviews
  if (page.reviews?.length) {
    obj.review = page.reviews.map(r => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: r.author },
      reviewRating: { '@type': 'Rating', ratingValue: r.ratingValue.toString() },
      reviewBody: r.body,
      datePublished: r.datePublished
    }));
  }

  // Optional: clarify itemReviewed
  obj.itemReviewed = { '@type': type, name: page.serviceType };

  return JSON.stringify(obj);
}
