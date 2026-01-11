export interface ServiceItem {
    id: number;
    title: string;
    description: string;
    image?: string;
}

import Web from '/images/Palette.png';
import Business from '/images/Arrow.png';
import IT from '/images/Lifering.png';

export const servicesData = [
    {
      id: 1,
      title: "Custom Websites That Convert",
      description:
        "Modern, fast designs built to grow your business. We create websites that reflect your brand, rank on Google and turn visitors into customers.",
        image:Web
    },
    {
      id: 2,
      title: "Local SEO & Visibility",
      description:
        "Search‑engine optimization and content strategies to boost your presence in Chicago and Cicero. We help the right people find you.",
        image:Business
    },
    {
      id: 3,
      title: "Maintenance & Ongoing Support",
      description:
        "Keep your site secure and up to date. We provide continued improvements and consulting so your investment keeps delivering results.",
        image:IT
    },
  ];
  