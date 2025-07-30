import { useEffect } from "react";
import Lenis from "lenis";

export function useLenis() {
  useEffect(() => {
    const lenis = new Lenis();

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
    };
  }, []);
}