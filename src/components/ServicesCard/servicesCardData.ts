export interface ServiceItem {
  id: number;
  title: string;
  label: string;
  description: string;
  image?: Record<string, unknown>;
}

import Web from "./lotties/Website.json";
import Business from "./lotties/Photo.json";
import IT from "./lotties/AI.json";

export const servicesData: ServiceItem[] = [
  {
    id: 1,
    label: "Design",
    title: "Website Design",
    description:
      "Modern, fast designs built to grow your business. We create websites that reflect your brand, rank on Google and turn visitors into customers.",
    image: Web,
  },
  {
    id: 2,
    label: "Development",
    title: "Website Development",
    description:
      "Custom-built sites with clean code, fast load times, and the integrations your business needs to run smoothly online.",
    image: Web,
  },
  {
    id: 3,
    label: "Strategy",
    title: "Website Strategy",
    description:
      "Conversion-focused planning so every page has a purpose — clearer messaging, stronger CTAs, and a site that supports your goals.",
    image: IT,
  },
  {
    id: 4,
    label: "Media",
    title: "Photo & Video",
    description:
      "High-impact photos and videos tailored to your brand that boost engagement on your website and social media.",
    image: Business,
  },
  {
    id: 5,
    label: "3D",
    title: "3D Development",
    description:
      "Interactive 3D visuals and experiences that help your brand stand out and keep visitors engaged longer.",
    image: IT,
  },
];
