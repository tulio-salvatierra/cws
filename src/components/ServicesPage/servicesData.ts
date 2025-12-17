import { Service } from './types';

export const servicesData: Service[] = [
  {
    id: 1,
    title: "Custom Websites",
    icon: "/images/Palette.png",
    description: "Custom-built websites from scratch or refreshed to look modern, fast, and conversion-focused",
    details: [
      "Custom website from scratch or full refresh",
      "Mobile-first, responsive layout and clean navigation",
      "Performance + SEO-ready structure (fast load, best practices)",
      "Optional animations + interactive sections"
    ],
    technologies: ["React", "Next.js", "TypeScript", "Tailwind CSS", "GSAP"],
    pricing: "Starting from $2,500"
  },
  {
    id: 2,
    title: "Photo & Video Content",
    icon: "/images/video.png",
    description: "Original photo and video content tailored for websites, branding, and local marketing",
    details: [
      "On-location photo/video tailored to your brand",
      "Short-form clips for website + social",
      "Professional edit + color grade",
      "Optimized files for fast web performance"
    ],
    technologies: ["Sony A7 Series", "Final Cut Pro", "Canva", "OBS"],
    pricing: "Starting from $500"
  },
  {
    id: 3,
    title: "Local SEO & Visibility",
    icon: "/images/Arrow.png",
    description: "SEO strategies designed to help local customers find your business online",
    details: [
      "On-page SEO (titles, headings, metadata)",
      "Local SEO targeting for Chicago neighborhoods",
      "Google Business Profile setup/optimization",
      "Analytics setup + performance tracking basics"
    ],
    technologies: ["Google Analytics", "Google Search Console", "Google Business Profile"],
    pricing: "Starting from $500"
  },
  {
    id: 4,
    title: "Website Growth Bundle",
    icon: "/images/Puzzle.png",
    description: "Everything you need to launch strong online — website, visuals, and visibility working together",
    details: [
      "Custom website + modern refresh",
      "Pro photo/video content included",
      "Local SEO + Google Business optimization",
      "Bundled savings + priority delivery"
    ],
    technologies: ["Next.js", "Tailwind CSS", "GSAP", "Google Analytics"],
    pricing: "Bundle pricing from $3,500"
  }
];

