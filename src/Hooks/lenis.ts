import { useEffect } from "react";
import Lenis from "lenis";

export function useLenis() {
  useEffect(() => {
    // Configure Lenis with mobile-friendly options
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 2,
      infinite: false,
    });

    // Make lenis globally accessible
    (window as any).lenis = lenis;

    interface RafFunction {
      (time: number): void;
    }

    const raf: RafFunction = function (time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy(); 
      delete (window as any).lenis;
    };
  }, []);
}