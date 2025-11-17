import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function useFadeInAnimation(
  refs: React.MutableRefObject<HTMLElement[]>
) {
  useEffect(() => {
    let ctx: gsap.Context | null = null;
    
    // Use a timeout to wait for refs to be collected
    const timeout = setTimeout(() => {
      if (!refs.current.length) return;

      const elements = [...refs.current]; // Copy array
      const scope = elements[0]?.parentElement || document.body;
      
      ctx = gsap.context(() => {
        // Set initial hidden state
        elements.forEach((el) => {
          gsap.set(el, {
            opacity: 0,
            y: 40,
          });
        });

        // Create animation for each element
        elements.forEach((el) => {
          gsap.to(el, {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power2.out",
            scrollTrigger: {
              trigger: el,
              start: "top 85%",
              toggleActions: "play none none none",
              once: true,
            },
          });
        });
        
        // Refresh ScrollTrigger and check for elements already in view
        ScrollTrigger.refresh();
        
        // After refresh, check if any elements are already past the trigger point
        setTimeout(() => {
          elements.forEach((el) => {
            const rect = el.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const triggerPoint = viewportHeight * 0.85;
            
            if (rect.top < triggerPoint) {
              // Element is already past trigger, animate it now
              gsap.to(el, {
                opacity: 1,
                y: 0,
                duration: 0.8,
                ease: "power2.out",
                overwrite: "auto",
              });
            }
          });
        }, 50);
      }, scope);
    }, 200);

    return () => {
      clearTimeout(timeout);
      if (ctx) {
        ctx.revert();
      }
    };
  }, [refs]);
}