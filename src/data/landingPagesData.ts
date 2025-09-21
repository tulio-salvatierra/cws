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
      description: 'If Cicero and Southwest Chicago customers can’t find you or your site loads slowly on their phones, they’ll bounce to a competitor.',
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
        text: 'Cicero Web Studio transformed our online presence. The site looks professional, loads fast, and we’re getting more calls each month.',
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
    }
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
    }
  },
  {
    id: 'berwyn-ecommerce',
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
    }
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
    }
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
    }
  }
];

export const getLandingPageData = (id: string): LandingPageData | undefined => {
  return landingPagesData.find(page => page.id === id);
};
