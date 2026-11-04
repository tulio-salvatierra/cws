import type { LandingPageData } from '../types/landingPage';
import { BASE_URL } from './seo';

export function buildServiceJsonLd(page: LandingPageData) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: page.serviceType,
    description: page.meta.description,
    areaServed: page.localHook.areas,
    url: `${BASE_URL}/landing/${page.id}`,
    provider: { '@id': `${BASE_URL}/#organization` },
    ...(page.imageUrl && { image: page.imageUrl }),
  };
}
