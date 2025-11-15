import { useLayoutEffect, RefObject } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// register plugin
gsap.registerPlugin(ScrollTrigger);

interface FadeInAnimationOptions {
  y?: number;
  opacity?: number;
  duration?: number;
  ease?: string;
  stagger?: number;
  start?: string;
  end?: string;
  scrub?: boolean;
  onComplete?: (el: Element) => void;
}

export function useFadeInAnimation(
  refsArray: RefObject<HTMLElement[]>,
  options: FadeInAnimationOptions = {}
) {
  useLayoutEffect(() => {
    if (!refsArray.current) return;

    const ctx = gsap.context(() => {
      refsArray.current?.forEach((el) => {
        gsap.from(el, {
          y: options.y ?? 20,
          opacity: options.opacity ?? 0,
          duration: options.duration ?? 1,
          ease: options.ease || "power2.out",
          stagger: options.stagger ?? 0.2,
          scrollTrigger: {
            trigger: el,
            start: options.start || "top 90%",
            end: options.end || "bottom bottom",
            scrub: options.scrub ?? false,
          },
          onComplete: () => {
            if (typeof options.onComplete === "function") {
              options.onComplete(el);
            }
          },
        });
      });
    }, refsArray);

    return () => ctx.revert();
  }, [refsArray, options]);
}

