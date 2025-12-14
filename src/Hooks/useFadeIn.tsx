import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export function useFadeIn() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!containerRef.current) return;

      const element = containerRef.current;

      const runFadeIn = () => {
        // Get all direct children
        const children = element.children;
        
        if (children.length === 0) {
          // If no children, animate the element itself
          gsap.set(element, { opacity: 0, y: 30 });
          gsap.to(element, {
            opacity: 1,
            y: 0,
            duration: 1.5,
            ease: "power3.out",
            stagger: 0.25,
            scrollTrigger: {
              trigger: element,
              start: "top 95%",
              toggleActions: "play none none none", // Play once and stay
            },
          });
        } else {
          // Animate children individually with stagger
          gsap.set(children, { opacity: 0, y: 30 });
          gsap.to(children, {
            opacity: 1,
            y: 0,
            duration: 1.5,
            stagger: 0.25,
            ease: "power3.out",
            scrollTrigger: {
              trigger: element,
              start: "top 95%",
              toggleActions: "play none none none", // Play once and stay
            },
          });
        }
      };

      // Run immediately
      runFadeIn();
    },
    { scope: containerRef }
  );

  return containerRef;
}
