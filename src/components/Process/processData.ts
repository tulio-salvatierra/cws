export interface ProcessStepItem {
  id: number;
  step: string;
  title: string;
  description: string;
  /** Optional step video — drop files in public/videos/process/ */
  video?: string;
  /** Poster / fallback image until videos are added */
  poster?: string;
}

export const processSteps: ProcessStepItem[] = [
  {
    id: 1,
    step: "01",
    title: "We uncover your story",
    description:
      "We dig deep into your brand, surface what makes you irreplaceable, and shape it into sharp positioning and a website strategy that connects in seconds.",
    video: "/videos/process/step-01.mp4",
    poster: "/images/website.jpg",
  },
  {
    id: 2,
    step: "02",
    title: "We shape your digital presence",
    description:
      "With your narrative locked, we design and direct a brand and website that feels premium, signals credibility, and gives your audience one clear reason to lean in and act.",
    video: "/videos/process/step-02.mp4",
    poster: "/images/csc.jpg",
  },
  {
    id: 3,
    step: "03",
    title: "We build with precision",
    description:
      "We develop your site with clean code, frequent check-ins, and a focus on speed, accessibility, and the details that make the experience feel effortless.",
    video: "/videos/process/step-03.mp4",
    poster: "/images/cleaning.jpg",
  },
  {
    id: 4,
    step: "04",
    title: "We send it into the world",
    description:
      "Your brand and website go live as a long-term asset that turns attention into opportunity, attracts the clients you're built for, and grows with you.",
    video: "/videos/process/step-04.mp4",
    poster: "/images/intermezzo.jpg",
  },
];
