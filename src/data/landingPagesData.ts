import { LandingPageData } from '../types/landingPage';

export const landingPagesData: LandingPageData[] = [
  {
    id: 'cicero-web-design',
    headline: 'Affordable Web Design for Cicero & Chicago Small Businesses',
    subtext: 'Launch a fast, mobile-friendly website that attracts local customers and grows with your business.',
    ctaText: 'Get a Free Quote',
    localKeyword: 'Cicero web design',
    serviceType: 'Web Design',
    location: 'Cicero, Chicago',
    problemStatement: {
      title: 'Is Your Website Costing You Customers?',
      description: 'If Cicero and Southwest Chicago customers can\'t find you or your site loads slowly on their phones, they\'ll bounce to a competitor.',
      painPoints: [
        'Outdated look vs. nearby competitors in Cicero/Garfield Ridge',
        'Slow load times and poor Core Web Vitals hurt conversions',
        'Not mobile-friendly — missing most local searches on the go'
      ]
    },
    solution: {
      title: 'Our Small Business Website Package',
      features: [
        'Custom, brand‑matched design (responsive by default)',
        'Performance-first build for speed & Core Web Vitals',
        'Local SEO setup (titles, metas, schema, GBP linking)',
        'Simple editing workflow so you can update content fast'
      ],
      startingPrice: 'Starting at $1,250+'
    },
    trustSection: {
      clients: ['TAMM Cleaning Services', "Carolina's Skin Center", 'Intermezzo Sound Studio'],
      testimonial: {
        text: 'Cicero Web Studio transformed our online presence. The site looks professional, loads fast, and we\'re getting more calls each month.',
        author: 'Mariana Josan',
        business: 'Local Business Owner'
      }
    },
    howItWorks: {
      title: 'How It Works',
      steps: [
        {
          number: '01',
          title: 'Schedule a Free Call',
          description: 'We discuss your goals, audience, and must‑have features'
        },
        {
          number: '02',
          title: 'We Design Your Site',
          description: 'Custom design and development tailored to your brand'
        },
        {
          number: '03',
          title: 'Launch & Support',
          description: 'Go live with on‑page SEO and optional maintenance'
        }
      ]
    },
    localHook: {
      title: 'Proudly Serving Our Local Community',
      description: 'Helping small businesses across Cicero and the Chicagoland area compete online without breaking the budget.',
      areas: ['Cicero', 'Garfield Ridge', 'Clearing', 'Chicagoland']
    },
    meta: {
      title: 'Affordable Web Design in Cicero & Chicago | Cicero Web Studio',
      description: 'Small‑business web design focused on speed, mobile UX, and local SEO. Serving Cicero, Garfield Ridge, and Chicagoland. Get a free quote today.',
      keywords: ['web design', 'Cicero web designer', 'Chicago small business websites', 'responsive design', 'local SEO', 'Core Web Vitals', 'affordable websites']
    },
    itemReviewedType: 'Service',
    imageUrl: 'https://cicerowebstudio.xyz/images/cicero-web-design.png',
    sku: 'CWS-WD-001',
    priceNumberUSD: 1250,
    rating: { ratingValue: 4.9, reviewCount: 37 },
    reviews: [
      {
        author: 'Mariana Josan',
        ratingValue: 5,
        body: 'Cicero Web Studio transformed our online presence. The site looks professional, loads fast, and we\'re getting more calls each month.',
        datePublished: '2025-03-01'
      }
    ]
  },
  {
    id: 'chicago-digital-marketing',
    headline: 'Digital Marketing Solutions for Chicago Businesses',
    subtext: 'Boost your online presence with our proven digital marketing strategies that drive traffic and increase sales.',
    ctaText: 'Start Your Campaign',
    localKeyword: 'Chicago digital marketing',
    serviceType: 'Digital Marketing',
    location: 'Chicago',
    problemStatement: {
      title: 'Struggling to Get Found Online?',
      description: 'Poor online visibility, low website traffic, and ineffective marketing campaigns are holding your business back.',
      painPoints: [
        'Your business doesn\'t show up in Google searches',
        'Low website traffic and poor conversion rates',
        'Wasting money on marketing that doesn\'t work'
      ]
    },
    solution: {
      title: 'Our Digital Marketing Package',
      features: [
        'Local SEO optimization for Chicago market',
        'Social media management & content creation',
        'Google Ads & Facebook advertising campaigns',
        'Monthly reporting and strategy adjustments'
      ],
      startingPrice: 'Starting at $899+'
    },
    trustSection: {
      clients: ['TAMM Cleaning Services', 'Carolina\'s Skin Center', 'Intermezzo Sound Studio'],
      testimonial: {
        text: 'Our online presence has completely transformed since working with Cicero Web Studio. We\'re getting more leads than ever before.',
        author: 'Sarah Johnson',
        business: 'Chicago Business Owner'
      }
    },
    howItWorks: {
      title: 'How It Works',
      steps: [
        {
          number: '01',
          title: 'Free Strategy Session',
          description: 'We analyze your current online presence and goals'
        },
        {
          number: '02',
          title: 'Launch Campaigns',
          description: 'We implement SEO, social media, and advertising strategies'
        },
        {
          number: '03',
          title: 'Monitor & Optimize',
          description: 'Continuous monitoring and optimization for best results'
        }
      ]
    },
    localHook: {
      title: 'Proudly Serving Our Local Community',
      description: 'We help small businesses compete online without breaking the budget.',
      areas: ['Chicago', 'Cicero', 'Garfield Ridge']
    },
    meta: {
      title: 'Digital Marketing Services in Chicago | Cicero Web Studio',
      description: 'Expert digital marketing services for Chicago businesses. SEO, social media, and PPC campaigns that deliver results.',
      keywords: ['digital marketing', 'Chicago', 'SEO', 'social media', 'PPC', 'online marketing']
    },
    itemReviewedType: 'Service',
    imageUrl: 'https://cicerowebstudio.xyz/images/digital-marketing.png',
    sku: 'CWS-DM-001',
    priceNumberUSD: 899,
    rating: { ratingValue: 4.8, reviewCount: 31 },
    reviews: [
      {
        author: 'Sarah Johnson',
        ratingValue: 5,
        body: 'Our online presence has completely transformed since working with Cicero Web Studio. We\'re getting more leads than ever before.',
        datePublished: '2025-02-15'
      }
    ]
  },
  {
    id: 'chicago-digital-marketing',
    headline: 'E-commerce Websites for Berwyn & Suburban Chicago Businesses',
    subtext: 'Launch your online store with a professional e-commerce website that converts visitors into customers.',
    ctaText: 'Launch My Store',
    localKeyword: 'Berwyn e-commerce',
    serviceType: 'E-commerce Development',
    location: 'Berwyn, Chicago',
    problemStatement: {
      title: 'Missing Out on Online Sales?',
      description: 'Without an e-commerce website, you\'re losing customers who prefer to shop online.',
      painPoints: [
        'No online store to capture digital sales',
        'Competitors with websites are taking your customers',
        'Limited to local customers only'
      ]
    },
    solution: {
      title: 'Our E-commerce Website Package',
      features: [
        'Professional online store design',
        'Secure payment processing integration',
        'Mobile-optimized shopping experience',
        'Inventory management system'
      ],
      startingPrice: 'Starting at $2,499+'
    },
    trustSection: {
      clients: ['TAMM Cleaning Services', 'Carolina\'s Skin Center', 'Intermezzo Sound Studio'],
      testimonial: {
        text: 'Our online store has been a game-changer. We\'re now reaching customers across the entire Chicago area.',
        author: 'Mike Rodriguez',
        business: 'Berwyn Business Owner'
      }
    },
    howItWorks: {
      title: 'How It Works',
      steps: [
        {
          number: '01',
          title: 'Product Catalog Setup',
          description: 'We organize and upload your products with professional photos'
        },
        {
          number: '02',
          title: 'Store Design & Development',
          description: 'Custom e-commerce design that reflects your brand'
        },
        {
          number: '03',
          title: 'Launch & Training',
          description: 'Go live with full training on managing your store'
        }
      ]
    },
    localHook: {
      title: 'Proudly Serving Our Local Community',
      description: 'We help small businesses compete online without breaking the budget.',
      areas: ['Berwyn', 'Cicero', 'Chicagoland']
    },
    meta: {
      title: 'E-commerce Website Development in Berwyn & Chicago | Cicero Web Studio',
      description: 'Professional e-commerce website development for businesses in Berwyn and Chicago. Online stores that drive sales and grow your business.',
      keywords: ['e-commerce', 'online store', 'Berwyn', 'Chicago', 'web development', 'online shopping']
    },
    itemReviewedType: 'Service',
    imageUrl: 'https://cicerowebstudio.xyz/images/ecommerce-development.png',
    sku: 'CWS-EC-001',
    priceNumberUSD: 2499,
    rating: { ratingValue: 4.9, reviewCount: 19 },
    reviews: [
      {
        author: 'Mike Rodriguez',
        ratingValue: 5,
        body: 'Our online store has been a game-changer. We\'re now reaching customers across the entire Chicago area.',
        datePublished: '2025-01-28'
      }
    ]
  },
  {
    id: 'oak-park-seo',
    headline: 'Local SEO Services for Oak Park & Chicago Area Businesses',
    subtext: 'Dominate local search results and attract more customers in your area with our proven SEO strategies.',
    ctaText: 'Boost My Rankings',
    localKeyword: 'Oak Park SEO',
    serviceType: 'Local SEO',
    location: 'Oak Park, Chicago',
    problemStatement: {
      title: 'Not Showing Up in Local Searches?',
      description: 'If customers can\'t find you on Google, you\'re missing out on valuable local business.',
      painPoints: [
        'Your business doesn\'t appear in local Google searches',
        'Competitors are ranking higher than you',
        'Missing out on customers searching for your services'
      ]
    },
    solution: {
      title: 'Our Local SEO Package',
      features: [
        'Google My Business optimization',
        'Local keyword research and targeting',
        'Citation building and directory submissions',
        'Monthly ranking reports and adjustments'
      ],
      startingPrice: 'Starting at $599+'
    },
    trustSection: {
      clients: ['TAMM Cleaning Services', 'Carolina\'s Skin Center', 'Intermezzo Sound Studio'],
      testimonial: {
        text: 'Since working with Cicero Web Studio, we\'re now the top result for our services in Oak Park. Business has never been better.',
        author: 'Jennifer Chen',
        business: 'Oak Park Business Owner'
      }
    },
    howItWorks: {
      title: 'How It Works',
      steps: [
        {
          number: '01',
          title: 'SEO Audit',
          description: 'We analyze your current online presence and identify opportunities'
        },
        {
          number: '02',
          title: 'Optimization',
          description: 'We optimize your website and listings for local search'
        },
        {
          number: '03',
          title: 'Monitor & Improve',
          description: 'Continuous monitoring and improvements for better rankings'
        }
      ]
    },
    localHook: {
      title: 'Proudly Serving Our Local Community',
      description: 'We help small businesses compete online without breaking the budget.',
      areas: ['Oak Park', 'Cicero', 'Chicagoland']
    },
    meta: {
      title: 'Local SEO Services in Oak Park & Chicago | Cicero Web Studio',
      description: 'Expert local SEO services for Oak Park and Chicago businesses. Get found by customers searching in your area.',
      keywords: ['local SEO', 'Oak Park', 'Chicago', 'search engine optimization', 'local marketing', 'Google rankings']
    },
    itemReviewedType: 'Service',
    imageUrl: 'https://cicerowebstudio.xyz/images/local-seo.png',
    sku: 'CWS-LSEO-001',
    priceNumberUSD: 599,
    rating: { ratingValue: 4.7, reviewCount: 28 },
    reviews: [
      {
        author: 'Jennifer Chen',
        ratingValue: 5,
        body: 'Since working with Cicero Web Studio, we\'re now the top result for our services in Oak Park. Business has never been better.',
        datePublished: '2025-02-05'
      }
    ]
  },
  {
    id: 'elmwood-park-maintenance',
    headline: 'Website Maintenance & Support for Elmwood Park Businesses',
    subtext: 'Keep your website running smoothly with our reliable maintenance and support services.',
    ctaText: 'Get Support',
    localKeyword: 'Elmwood Park web maintenance',
    serviceType: 'Website Maintenance',
    location: 'Elmwood Park, Chicago',
    problemStatement: {
      title: 'Website Issues Costing You Business?',
      description: 'Broken links, slow loading times, and security issues can drive customers away.',
      painPoints: [
        'Website crashes or loads slowly',
        'Security vulnerabilities putting your business at risk',
        'Outdated content and broken features'
      ]
    },
    solution: {
      title: 'Our Website Maintenance Package',
      features: [
        'Regular security updates and backups',
        'Performance optimization and speed improvements',
        'Content updates and bug fixes',
        '24/7 monitoring and support'
      ],
      startingPrice: 'Starting at $199+'
    },
    trustSection: {
      clients: ['TAMM Cleaning Services', 'Carolina\'s Skin Center', 'Intermezzo Sound Studio'],
      testimonial: {
        text: 'Having Cicero Web Studio handle our website maintenance gives us peace of mind. Our site is always running smoothly.',
        author: 'David Thompson',
        business: 'Elmwood Park Business Owner'
      }
    },
    howItWorks: {
      title: 'How It Works',
      steps: [
        {
          number: '01',
          title: 'Website Assessment',
          description: 'We review your current website and identify maintenance needs'
        },
        {
          number: '02',
          title: 'Ongoing Maintenance',
          description: 'Regular updates, backups, and performance monitoring'
        },
        {
          number: '03',
          title: 'Support & Reporting',
          description: '24/7 support with monthly reports on website health'
        }
      ]
    },
    localHook: {
      title: 'Proudly Serving Our Local Community',
      description: 'We help small businesses compete online without breaking the budget.',
      areas: ['Elmwood Park', 'Cicero', 'Chicagoland']
    },
    meta: {
      title: 'Website Maintenance Services in Elmwood Park | Cicero Web Studio',
      description: 'Professional website maintenance and support services for Elmwood Park businesses. Keep your site secure, fast, and up-to-date.',
      keywords: ['website maintenance', 'Elmwood Park', 'web support', 'website updates', 'security', 'performance']
    },
    itemReviewedType: 'Service',
    imageUrl: 'https://cicerowebstudio.xyz/images/website-maintenance.png',
    sku: 'CWS-WM-001',
    priceNumberUSD: 199,
    rating: { ratingValue: 4.8, reviewCount: 22 },
    reviews: [
      {
        author: 'David Thompson',
        ratingValue: 5,
        body: 'Having Cicero Web Studio handle our website maintenance gives us peace of mind. Our site is always running smoothly.',
        datePublished: '2025-01-20'
      }
    ]
  },
  {
    id: 'website-refresh-redesign',
    headline: 'Give Your Website a Fresh Look That Brings in More Customers',
    subtext: 'Fast, modern, and optimized for mobile — we redesign your site so it works harder for your business.',
    ctaText: 'Request a Redesign Quote',
    localKeyword: 'website redesign',
    serviceType: 'Website Refresh & Redesign',
    location: 'Chicago',
    problemStatement: {
      title: 'Is Your Outdated Website Holding You Back?',
      description: 'An old or clunky design can hurt credibility and push customers to competitors.',
      painPoints: [
        'Outdated look and poor usability',
        'Not optimized for mobile devices',
        'Slow performance and poor SEO results'
      ]
    },
    solution: {
      title: 'Our Website Refresh & Redesign Package',
      features: [
        'Modern design tailored to your brand',
        'Mobile-first, responsive layouts',
        'Improved site speed and performance',
        'SEO-friendly structure to boost rankings'
      ],
      startingPrice: 'Starting at $1,000+'
    },
    trustSection: {
      clients: ['TAMM Cleaning Services', "Carolina's Skin Center", 'Intermezzo Sound Studio'],
      testimonial: {
        text: 'The redesign by Cicero Web Studio gave our site a professional edge. Customers are staying longer and contacting us more.',
        author: 'Laura Martinez',
        business: 'Chicago Business Owner'
      }
    },
    howItWorks: {
      title: 'How It Works',
      steps: [
        {
          number: '01',
          title: 'Free Consultation',
          description: 'We review your existing website and goals'
        },
        {
          number: '02',
          title: 'Redesign & Development',
          description: 'We create a new, modern design optimized for performance'
        },
        {
          number: '03',
          title: 'Launch & Showcase',
          description: 'Your site goes live, complete with before-and-after examples'
        }
      ]
    },
    localHook: {
      title: 'Proudly Serving Our Local Community',
      description: 'Helping businesses across Chicago and surrounding areas modernize their online presence.',
      areas: ['Chicago', 'Cicero', 'Chicagoland']
    },
    meta: {
      title: 'Website Refresh & Redesign Services in Chicago | Cicero Web Studio',
      description: 'Modern, mobile-friendly website redesigns for Chicago businesses. Improve performance, SEO, and customer experience.',
      keywords: ['website redesign', 'Chicago website refresh', 'modern website design', 'mobile-friendly redesign']
    },
    itemReviewedType: 'Service',
    imageUrl: 'https://cicerowebstudio.xyz/images/website-redesign.png',
    sku: 'CWS-WRR-001',
    priceNumberUSD: 1000,
    rating: { ratingValue: 4.9, reviewCount: 24 },
    reviews: [
      {
        author: 'Laura Martinez',
        ratingValue: 5,
        body: 'The redesign by Cicero Web Studio gave our site a professional edge. Customers are staying longer and contacting us more.',
        datePublished: '2025-02-10'
      }
    ]
  }
];

export const getLandingPageData = (id: string): LandingPageData | undefined => {
  return landingPagesData.find(page => page.id === id);
};
