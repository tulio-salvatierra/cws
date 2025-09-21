# Landing Pages System

This project includes a reusable landing page system that allows you to create dynamic, SEO-optimized landing pages for different services and locations.

## How It Works

### 1. Dynamic Routing
Landing pages are accessible via the route pattern: `/landing/:id`

Examples:
- `/landing/cicero-web-design`
- `/landing/chicago-digital-marketing`
- `/landing/berwyn-ecommerce`

### 2. Data Structure
Each landing page is defined in `src/data/landingPagesData.ts` with the following structure:

```typescript
{
  id: 'unique-identifier',
  headline: 'Clear benefit + local keyword',
  subtext: '1-2 sentences on the value proposition',
  ctaText: 'Call-to-action button text',
  localKeyword: 'Local SEO keyword',
  serviceType: 'Type of service',
  location: 'Geographic location',
  meta: {
    title: 'SEO-optimized page title',
    description: 'Meta description for search engines',
    keywords: ['array', 'of', 'keywords']
  }
}
```

### 3. Complete Landing Page Sections
- **Hero Section**: Above the fold design with clear headline, value proposition, and CTA
- **Problem Statement**: Highlights pain points your service solves with visual icons
- **Solution Section**: Features your service package with transparent pricing
- **Trust Section**: Client logos and testimonials to build credibility
- **How It Works**: 3-step process with visual icons and clear descriptions
- **Local Hook**: Community connection and service areas
- **Contact Form**: Enhanced form with business type and service selection
- **Direct Contact**: Phone and email for immediate contact

### 4. Enhanced Contact Form
- **Required fields**: Name, Email, Service Interested In
- **Optional fields**: Phone, Business Type, Project Details
- **Business type dropdown**: Restaurant, Retail, Service, Healthcare, etc.
- **Service selection**: Web Design, Digital Marketing, E-commerce, SEO, etc.
- **Direct contact info**: Phone number and email for immediate contact
- **Smooth scroll** from CTA button
- **Professional styling** matching brand design

## Adding New Landing Pages

To create a new landing page:

1. **Add data** to `src/data/landingPagesData.ts`:
```typescript
{
  id: 'your-unique-id',
  headline: 'Your Service for Your Location',
  subtext: 'Your value proposition in 1-2 sentences.',
  ctaText: 'Your CTA Text',
  localKeyword: 'your local keyword',
  serviceType: 'Your Service Type',
  location: 'Your Location',
  problemStatement: {
    title: 'Your Problem Title',
    description: 'Description of the problem you solve.',
    painPoints: ['Pain point 1', 'Pain point 2', 'Pain point 3']
  },
  solution: {
    title: 'Your Service Package',
    features: ['Feature 1', 'Feature 2', 'Feature 3', 'Feature 4'],
    startingPrice: '$X,XXX'
  },
  trustSection: {
    clients: ['Client 1', 'Client 2', 'Client 3'],
    testimonial: {
      text: 'Testimonial text here.',
      author: 'Client Name',
      business: 'Business Name'
    }
  },
  howItWorks: {
    title: 'How It Works',
    steps: [
      {
        number: '01',
        title: 'Step 1 Title',
        description: 'Step 1 description'
      },
      {
        number: '02',
        title: 'Step 2 Title',
        description: 'Step 2 description'
      },
      {
        number: '03',
        title: 'Step 3 Title',
        description: 'Step 3 description'
      }
    ]
  },
  localHook: {
    title: 'Proudly Serving Our Local Community',
    description: 'We help small businesses compete online without breaking the budget.',
    areas: ['Area 1', 'Area 2', 'Area 3']
  },
  meta: {
    title: 'SEO Title | Cicero Web Studio',
    description: 'SEO description for search engines.',
    keywords: ['relevant', 'keywords', 'for', 'seo']
  }
}
```

2. **Access the page** at `/landing/your-unique-id`

## Current Landing Pages

- **Cicero Web Design**: `/landing/cicero-web-design`
- **Chicago Digital Marketing**: `/landing/chicago-digital-marketing`
- **Berwyn E-commerce**: `/landing/berwyn-ecommerce`
- **Oak Park SEO**: `/landing/oak-park-seo`
- **Elmwood Park Maintenance**: `/landing/elmwood-park-maintenance`

## Customization

### Styling
The landing pages use Tailwind CSS classes and can be customized by modifying:
- `src/components/LandingPage/LandingPage.tsx` - Main component
- `src/index.css` - Global styles
- `tailwind.config.js` - Tailwind configuration

### Content
All content is dynamically loaded from the data file, making it easy to:
- A/B test different headlines
- Update content without code changes
- Scale to hundreds of landing pages

## SEO Features

- Dynamic meta tags (title, description, keywords)
- Local keyword optimization
- Mobile-responsive design
- Fast loading times
- Clean URL structure

## Future Enhancements

The system is designed to be easily extended with:
- Additional sections (testimonials, features, pricing)
- Analytics integration
- A/B testing capabilities
- Content management system integration