import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export function useFadeIn(selector?: string) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!containerRef.current) return;

      const element = containerRef.current;
      let elementsToAnimate: Element[];

      if (selector) {
        // If selector provided, find all matching elements within the container
        elementsToAnimate = Array.from(element.querySelectorAll(selector));
      } else {
        // Default: check for children or animate self
        const children = element.children;
        elementsToAnimate = children.length > 0 ? Array.from(children) : [element];
      }

      if (elementsToAnimate.length === 0) return;

      // Set initial state for all elements
      gsap.set(elementsToAnimate, { opacity: 0, y: 30 });

      // Animate all elements with stagger
      gsap.to(elementsToAnimate, {
        opacity: 1,
        y: 0,
        duration: 1.5,
        stagger: 0.15,
        ease: "power3.out",
        scrollTrigger: {
          trigger: elementsToAnimate[0] as Element,
          start: "top 95%",
          toggleActions: "play none none none", // Play once and stay
        },
      });
    },
    { scope: containerRef, dependencies: [selector] }
  );

  return containerRef;
}
