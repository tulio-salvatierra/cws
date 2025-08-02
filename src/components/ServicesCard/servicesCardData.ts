export interface ServiceItem {
    id: number;
    title: string;
    description: string;
    image?: string;
}

export const servicesData = [
    {
      id: 1,
      title: "Web Design & Development",
      description:
        "Transform your online presence with sleek, conversion-focused websites that capture your brand's essence and drive customer action.",
        image:"https://i.pinimg.com/1200x/f2/2d/2a/f22d2afa19665d3dcf1d1480f1f527c2.jpg"
    },
    {
      id: 2,
      title: "Business Automation",
      description:
        "Streamline your operations with smart automation solutions that save time, reduce errors, and boost productivity.",
        image:"https://i.pinimg.com/1200x/60/50/04/60500432d2ddf025a57b745aa3ca3c7d.jpg"
    },
    {
      id: 3,
      title: "IT Support & Consulting",
      description:
        "Keep your technology running smoothly with reliable support and strategic guidance tailored to your business needs.",
        image:"https://i.pinimg.com/736x/2e/7b/d6/2e7bd673aaf90ab9eda41ecc19477532.jpg"
    },
  ];
  