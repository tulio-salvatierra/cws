type ProjectExtraLink = { label: string; href: string };

export type Project = {
  title: string;
  image?: string;
  alt: string;
  description: string;
} & (
  | { status?: "launched" | "beta"; link: string; linkLabel?: string; secondaryLink?: ProjectExtraLink }
  | { status: "upcoming"; link?: never; linkLabel?: never; secondaryLink?: never }
);

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
    link: "https://carolinaskincentre.com",
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
    // TODO: add a cover image (e.g. /images/projects/drummer-chart-ai.jpg) once the
    // final logo and screenshots are picked. Until then the card shows the text placeholder.
    title: "Drummer Chart AI",
    alt: "Drummer Chart AI click track web app for drummers",
    description:
      "Drop in a song, get a click track that knows where the chorus is. Upload an MP3 and it finds the tempo and the one, marks each section, and cues you before every change. Built in-house by Tulio, our founder and a drummer, and tested on real songs.",
    status: "beta",
    link: "https://drummerchartai-production.up.railway.app",
    linkLabel: "Try the beta →",
    secondaryLink: { label: "See how it works →", href: "https://drummerchart-ai.vercel.app" },
  },
];
