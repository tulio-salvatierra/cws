/**
 * SEO Utility Functions
 * Manages meta tags, canonical URLs, and structured data
 */

const BASE_URL = 'https://cicerowebstudio.xyz';

export interface SEOData {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'profile';
  keywords?: string[];
  noindex?: boolean;
}

/**
 * Updates document title and meta tags
 */
export function updateSEO(data: SEOData) {
  // Update title
  document.title = data.title;

  // Update or create meta description
  let metaDesc = document.querySelector('meta[name="description"]');
  if (!metaDesc) {
    metaDesc = document.createElement('meta');
    metaDesc.setAttribute('name', 'description');
    document.head.appendChild(metaDesc);
  }
  metaDesc.setAttribute('content', data.description);

  // Update canonical URL
  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  canonical.setAttribute('href', data.canonical || `${BASE_URL}${window.location.pathname}`);

  // Update Open Graph tags
  updateMetaTag('property', 'og:title', data.title);
  updateMetaTag('property', 'og:description', data.description);
  updateMetaTag('property', 'og:url', data.canonical || `${BASE_URL}${window.location.pathname}`);
  updateMetaTag('property', 'og:type', data.ogType || 'website');
  
  if (data.ogImage) {
    updateMetaTag('property', 'og:image', data.ogImage);
  }

  // Update Twitter Card tags
  updateMetaTag('name', 'twitter:title', data.title);
  updateMetaTag('name', 'twitter:description', data.description);
  if (data.ogImage) {
    updateMetaTag('name', 'twitter:image', data.ogImage);
  }

  // Update keywords if provided
  if (data.keywords && data.keywords.length > 0) {
    updateMetaTag('name', 'keywords', data.keywords.join(', '));
  }

  // Handle robots meta tag
  if (data.noindex) {
    updateMetaTag('name', 'robots', 'noindex, nofollow');
  } else {
    updateMetaTag('name', 'robots', 'index, follow');
  }
}

/**
 * Helper function to update or create meta tags
 */
function updateMetaTag(attribute: 'name' | 'property', value: string, content: string) {
  let meta = document.querySelector(`meta[${attribute}="${value}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(attribute, value);
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', content);
}

/**
 * Generates Organization JSON-LD schema
 */
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${BASE_URL}/#organization`,
    name: 'Cicero Web Studio',
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    image: `${BASE_URL}/logo.png`,
    description: 'Modern web solutions for small businesses. Custom websites, digital marketing, and ongoing support.',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Cicero',
      addressRegion: 'IL',
      addressCountry: 'US'
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+1-786-314-6121',
      contactType: 'Customer Service',
      email: 'info@cicerowebstudio.xyz',
      areaServed: ['Cicero', 'Chicago', 'Berwyn', 'Oak Park', 'Elmwood Park'],
      availableLanguage: 'English'
    },
    sameAs: [
      'https://www.instagram.com/cicerowebstudio',
      'https://www.facebook.com/cicerowebstudio',
      'https://www.youtube.com/cicerowebstudio',
      'https://www.linkedin.com/company/cicerowebstudio'
    ],
    priceRange: '$$',
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '09:00',
      closes: '18:00'
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '37'
    }
  };
}

/**
 * Generates BreadcrumbList JSON-LD schema
 */
export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${BASE_URL}${item.url}`
    }))
  };
}

/**
 * Adds JSON-LD script to document head
 */
export function addJsonLd(data: object, id?: string) {
  // Remove existing script with same id if present
  if (id) {
    const existing = document.querySelector(`script[data-jsonld-id="${id}"]`);
    if (existing) {
      existing.remove();
    }
  }

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(data);
  if (id) {
    script.setAttribute('data-jsonld-id', id);
  }
  document.head.appendChild(script);
}
