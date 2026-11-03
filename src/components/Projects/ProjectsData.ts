export type Project = {
  title: string;
  image?: string;
  alt: string;
  description: string;
} & ({ status?: "launched"; link: string } | { status: "upcoming"; link?: never });

export const projects: Project[] = [
  {
    title: "Clean and Shiny",
    image: "/images/projects/clean-and-shiny.jpg",
    alt: "Clean and Shiny cleaning services website",
    description: "Chicago cleaning services website with residential and commercial service information and a detailed quote request form.",
    link: "https://www.cleanandshinychicago.com/",
  },
  {
    title: "Upholstery of Chicago",
    image: "/images/projects/upholstery-of-chicago.jpg",
    alt: "Upholstery of Chicago custom bed website",
    description: "Custom upholstered bed website with an interactive 3D builder and quote requests for personalized designs.",
    link: "https://upholsteryofchicago.com/",
  },
  {
    title: "Dominó de Barrio",
    image: "/images/projects/domino-de-barrio.jpg",
    alt: "Dominó de Barrio online domino game",
    description: "Online multiplayer domino game with a responsive table and mobile-friendly play controls.",
    link: "https://domino-de-barrio.tulio1749.chatgpt.site/",
  },
  {
    title: "Carolina's Skin Center",
    image: "/images/csc.jpg",
    alt: "Carolina's Skin Center Website",
    description:
      "Luxury skincare and medical aesthetics website with elegant design, responsive layout, and service-focused user experience.",
    link: "https://www.carolinaskincenter.com/",
  },
  {
    title: "Intermezzo Sound Studio",
    image: "/images/intermezzo.jpg",
    alt: "Intermezzo Sound Studio website",
    description: "Remote music production studio website featuring recording services, audio engineering, and music production for emerging artists.",
    link: "https://www.intermezzosoundstudio.com/",
  },
  {
    title: "Kike Vivaldy",
    image: "/images/projects/kike-vivaldy.jpg",
    alt: "Kike Vivaldy website",
    description: "Redesigned artist website for Colombian guitarist Kike Vivaldy, featuring Nova Flamenco music, live shows, records, and booking.",
    link: "https://www.kikevivaldy.com/",
  },
  {
    title: "Ecclection",
    image: "/images/ecclection_light.mp4",
    alt: "Ecclection website",
    description: "Local artisan marketplace and variety store website for community building, artisan showcases, and e-commerce functionality.",
    link: "https://www.ecclection.com/",
  },
  {
    title: "Drum Chart AI",
    alt: "Drum Chart AI — upcoming project",
    description: "A drum-chart project in development. Upcoming — not yet launched.",
    status: "upcoming",
  },
];
