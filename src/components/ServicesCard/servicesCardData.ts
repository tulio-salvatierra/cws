export interface ServiceItem {
    id: number;
    title: string;
    description: string;
    image?: string;
}

import Web from '../../assets/images/website.jpg';
import Business from '../../assets/images/auto.jpg';
import IT from '../../assets/images/support.png';

export const servicesData = [
    {
      id: 1,
      title: "Web Design & Development",
      description:
        "Transform your online presence with sleek, conversion-focused websites that capture your brand's essence and drive customer action.",
        image:Web
    },
    {
      id: 2,
      title: "Business Automation",
      description:
        "Streamline your operations with smart automation solutions that save time, reduce errors, and boost productivity.",
        image:Business
    },
    {
      id: 3,
      title: "IT Support & Consulting",
      description:
        "Keep your technology running smoothly with reliable support and strategic guidance tailored to your business needs.",
        image:IT
    },
  ];
  