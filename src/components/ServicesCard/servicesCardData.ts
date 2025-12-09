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
      title: "Custom Websites That Stand Out",
      description:
        "Modern, fast, and crafted for small-business growth.",
        image:Web
    },
    {
      id: 2,
      title: "Local SEO & Visibility Boosting",
      description:
        "Streamline Get found in Chicago — Maps, Search, and everywhere that matters.",
        image:Business
    },
    {
      id: 3,
      title: "Ongoing Support & Digital Enhancements",
      description:
        "Real partnership, updates, content, and strategy whenever you need it.",
        image:IT
    },
  ];
  