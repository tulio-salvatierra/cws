import { Service } from './types';

export const servicesData: Service[] = [
  {
    id: 1,
    title: "Custom Websites",
    icon: "/images/Palette.png",
    description: "We build fast, SEO‑ready sites that reflect your brand and turn visitors into customers. Mobile‑first design ensures your clients can book appointments or make purchases from any device.",
    details: [
      "Custom website design and development from scratch or full website refresh",
      "Mobile-first responsive design and clean navigation for enhanced user experience",
      "Performance optimization + SEO-ready structure with fast load times and best practices",
      "Local SEO integration for Cicero and Chicago businesses to improve search results",
      "Optional animations and interactive sections to engage visitors and boost conversions"
    ],
    technologies: ["React", "Next.js", "TypeScript", "Tailwind CSS", "GSAP"],
    pricing: "Starting from $2,500"
  },
  {
    id: 2,
    title: "Photo & Video Content",
    icon: "/images/video.png",
    description: "High‑impact photos and videos tailored to your brand that boost engagement on your website and social media, helping you attract and retain more clients.",
    details: [
      "On-location photo and video production tailored to your brand and business",
      "Short-form video clips optimized for website and social media platforms",
      "Professional video editing and color grading for polished results",
      "Optimized image and video files for fast web performance and SEO",
      "Content creation for local marketing and digital marketing campaigns"
    ],
    technologies: ["Sony A7 Series", "Final Cut Pro", "Canva", "OBS"],
    pricing: "Starting from $500"
  },
  {
    id: 3,
    title: "Local SEO & Visibility",
    icon: "/images/Arrow.png",
    description: "We help Chicago and Cicero businesses rise to the top of local search results—driving foot traffic, phone calls and online enquiries.",
    details: [
      "On-page SEO optimization including titles, headings, and metadata for search engines",
      "Local SEO targeting for Chicago neighborhoods, Cicero, and Chicagoland areas",
      "Google Business Profile setup and optimization to improve local search visibility",
      "Search engine results page (SERP) optimization and ranking improvements",
      "Google Analytics and Search Console setup with performance tracking and reporting"
    ],
    technologies: ["Google Analytics", "Google Search Console", "Google Business Profile"],
    pricing: "Starting from $500"
  },
  {
    id: 4,
    title: "Website Growth Bundle",
    icon: "/images/Puzzle.png",
    description: "Everything you need to grow online in one package: custom website, professional visuals, and local SEO services working together to boost your online presence and reach local customers.",
    details: [
      "Custom website design and development with modern refresh and responsive layout",
      "Professional photo and video content creation included for branding",
      "Local SEO services + Google Business Profile optimization for search visibility",
      "Search engine optimization (SEO) to improve rankings and online visibility",
      "Bundled savings with priority delivery and ongoing support for long-term growth"
    ],
    technologies: ["Next.js", "Tailwind CSS", "GSAP", "Google Analytics"],
    pricing: "Bundle pricing from $3,500"
  }
];

