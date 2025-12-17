import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./How.css";
import ProcessSection from "../ServicesPage/ProcessSection/ProcessSection";

gsap.registerPlugin(ScrollTrigger);

interface HowProps {
  scrollText?: string;
  description?: string;
  title?: string;
  mediaSrc?: string;
  mediaAlt?: string;
}

export default function How({
  scrollText = "Scroll",
  description = "At Soundtrack, we don't just deliver music—we build the tools that create it. OUR VST OFFER powerful sound-shaping capabilities and intuitive controls that fuel creativity across every genre.",
  title = "Soundtrack® synthesizes the sound of tomorrow.",
  mediaSrc = "/images/website.jpg",
  mediaAlt = ""
}: HowProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const scrollIndicatorRef = useRef<HTMLParagraphElement>(null);
  const mediaRef = useRef<HTMLImageElement>(null);

  // Split title into words
  const words = title.split(' ').filter(word => word.length > 0);

  useGSAP(() => {
    const section = sectionRef.current;
    if (!section) return;

    // Animate scroll indicator - scoped to this section
    if (scrollIndicatorRef.current) {
      gsap.to(scrollIndicatorRef.current, {
        autoAlpha: 0,
        duration: 0.2,
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: 'top top-=1',
          toggleActions: "play none reverse none"
        }
      });
    }

    // Animate words - scoped to this section only
    const wordElements = section.querySelectorAll('.word');
    wordElements.forEach((word) => {
      gsap.to(word.children, {
        yPercent: '+=100', // Increase the y position by 100%
        ease: 'expo.inOut',
        scrollTrigger: {
          trigger: word, // Listens to the position of word
          start: "bottom bottom",
          end: "top 55%",
          scrub: 0.4 // Smooth scrubbing, takes 0.4 seconds to complete
        }
      });
    });
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className="mwg_effect015 my-20">      
      <div className="container">
        <p className="homepage-title">
          <span className="word font-main text-8xl font-semibold">
            <span className="word-hidden text-white">HOW</span>
            <span className="word-visible text-orange-500">HOW</span>
          </span>
          <br />
          <span className="word font-main text-8xl italic font-bold">
            <span className="word-hidden text-orange-500 text-center">DOES</span>
            <span className="word-visible text-center text-white">DOES</span>
          </span>
          <br />
          <span className="word font-main text-8xl font-normal">
            <span className="word-hidden text-center text-white">IT</span>
            <span className="word-visible text-center text-orange-500">IT</span>
          </span>
          <br />
          <span className="word font-main font-8xl">
            <span className="word-hidden text-center text-orange-500">WORK</span>
            <span className="word-visible text-center text-white">WORK</span>
          </span>
        </p> 
      </div>

      <ProcessSection />
    </section>
  );
}

