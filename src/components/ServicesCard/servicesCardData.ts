export interface ServiceItem {
  id: number;
  title: string;
  description: string;
  image?: Record<string, unknown>;
}

import Web from "./lotties/Website.json";
import Business from "./lotties/Photo.json";
import IT from "./lotties/AI.json";

export const servicesData: ServiceItem[] = [
  {
    id: 1,
    title: "Custom Websites That Convert",
    description:
      "Modern, fast designs built to grow your business. We create websites that reflect your brand, rank on Google and turn visitors into customers.",
    image: Web,
  },
  {
    id: 2,
    title: "Photo & Video Content",
    description:
      "We create high-impact photos and videos tailored to your brand that boost engagement on your website and social media, helping you attract and retain more clients.",
    image: Business,
  },
  {
    id: 3,
    title: "AI AGENTS",
    description:
      "We create custom AI agents that automate repetitive tasks, improve efficiency and save you time and money.",
    image: IT,
  },

];
