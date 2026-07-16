import callVideo from "../../assets/video/proccess/call.mp4";
import shapeVideo from "../../assets/video/proccess/shape.mp4";
import precisionVideo from "../../assets/video/proccess/precision.mp4";
import sendVideo from "../../assets/video/proccess/send.mp4";
import callPoster from "../../assets/images/website.jpg";
import shapePoster from "../../assets/images/csc.jpg";
import precisionPoster from "../../assets/images/cleaning.jpg";
import sendPoster from "../../assets/images/intermezzo.jpg";

export interface ProcessStepItem {
  id: number;
  step: string;
  title: string;
  description: string;
  video?: string;
  poster?: string;
}

export const processSteps: ProcessStepItem[] = [
  {
    id: 1,
    step: "01",
    title: "We talk",
    description:
      "We dig deep into your brand, surface what makes you irreplaceable, and shape it into sharp positioning and a website strategy that connects in seconds.",
    video: callVideo,
    poster: callPoster,
  },
  {
    id: 2,
    step: "02",
    title: "We shape your story",
    description:
      "With your narrative locked, we design and direct a brand and website that feels premium, signals credibility, and gives your audience one clear reason to lean in and act.",
    video: shapeVideo,
    poster: shapePoster,
  },
  {
    id: 3,
    step: "03",
    title: "We build with precision",
    description:
      "We develop your site with clean code, frequent check-ins, and a focus on speed, accessibility, and the details that make the experience feel effortless.",
    video: precisionVideo,
    poster: precisionPoster,
  },
  {
    id: 4,
    step: "04",
    title: "We send it into the world",
    description:
      "Your brand and website go live as a long-term asset that turns attention into opportunity, attracts the clients you're built for, and grows with you.",
    video: sendVideo,
    poster: sendPoster,
  },
];
