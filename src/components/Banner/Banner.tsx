import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import BF from "../../assets/banner/cwsbanner.svg";
import "./Banner.css";

export default function Banner() {
  const containerRef = useRef(null);
  const phraseRef = useRef<HTMLParagraphElement | null>(null);

  // This effect creates a horizontal scroll animation on the banner using GSAP.
  // The phrase (a horizontally repeated image) scrolls leftward continuously,
  // with added speed when the user scrolls the mouse wheel. The `wrap` utility
  // creates a seamless infinite loop.
  //
  // 🔧 To tweak:
  // - Change `1.2` in `total -= 1.2 + wheelDelta` to adjust base scroll speed.
  // - Change `wheelDelta += e.deltaY * 0.02` to modify scroll sensitivity.
  // - Update `phraseRef` content or image (`BF`) to customize visuals.
  // - Use `phraseWidth` to control how many repetitions to render in the phrase.
  useEffect(() => {
    // Early return for SSR/production safety
    if (typeof window === 'undefined') return;
    
    // Add a small delay to ensure DOM elements are fully rendered
    const initAnimation = () => {
      // Early return if elements are not available (for production safety)
      if (!containerRef.current || !phraseRef.current) {
        console.log('Banner: DOM elements not ready, retrying...');
        return;
      }
      
      let wheelDelta = 0;
      let total = 0;
      const content = containerRef.current;
      const phraseWidth = phraseRef.current ? phraseRef.current.clientWidth : 0;
      
      // Don't initialize if phraseWidth is 0 (element not properly loaded)
      if (phraseWidth === 0) {
        console.log('Banner: Phrase width is 0, retrying...');
        return;
      }
      
      console.log('Banner: Initializing with phraseWidth:', phraseWidth);
      const wrap = gsap.utils.wrap(-phraseWidth, 0);

      const xTo = gsap.quickTo(content, "x", {
        duration: 1,
        ease: "none",
        modifiers: {
          x: gsap.utils.unitize(wrap),
        },
      });

      const tick = () => {
        if (!content) return; // Safety check
        total -= 8 + wheelDelta * 1;
        xTo(total);

        wheelDelta *= 0.9;
        if (Math.abs(wheelDelta) < 0.01) wheelDelta = 0;
      };

      const handleWheel = (e: { deltaY: number }) => {
        wheelDelta += e.deltaY * 0.08;
      };

      gsap.ticker.add(tick);
      if (typeof window !== 'undefined') {
        window.addEventListener("wheel", handleWheel, { passive: true });
      }

      return () => {
        if (typeof window !== 'undefined') {
          window.removeEventListener("wheel", handleWheel);
        }
        gsap.ticker.remove(tick);
      };
    };

    // Try multiple times with increasing delays for production reliability
    let attempts = 0;
    const maxAttempts = 5;
    let cleanupFn: (() => void) | null = null;

    const tryInit = () => {
      attempts++;
      const cleanup = initAnimation();
      
      if (cleanup && typeof cleanup === 'function') {
        cleanupFn = cleanup;
      } else if (attempts < maxAttempts) {
        // Retry with exponential backoff
        setTimeout(tryInit, 100 * attempts);
      }
    };

    // Initial attempt after a small delay
    const timeoutId = setTimeout(tryInit, 100);
    
    return () => {
      clearTimeout(timeoutId);
      if (cleanupFn) {
        cleanupFn();
      }
    };
  }, []);

  return (
    <section className="mwg_effect013 h-screen flex items-center justify-center">
      <div className="banner-wrapper">
        <div className="inner">
          <div className="banner-container" ref={containerRef}>
            <p
              className="phrase flex"
              ref={phraseRef}
              style={{ height: "500px" }}
            >
              {Array.from({ length: 100 }).map((_, index) => (
                <span key={index} className="phrase-item">
                  <img 
                    src={BF} 
                    alt="Cicero Web Studio Banner" 
                    className="block" 
                    loading="lazy"
                    onError={(e) => {
                      console.error('Banner image failed to load:', e);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </span>
              ))}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
