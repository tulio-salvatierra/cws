import { useEffect, useRef } from 'react';
import { gsap } from "gsap";
import BF from "@/assets/Images/cwsbanner.svg";
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
    let wheelDelta = 0;
    let total = 0;
    const content = containerRef.current;
    const phraseWidth = phraseRef.current ? phraseRef.current.clientWidth : 0;
    const wrap = gsap.utils.wrap(-phraseWidth, 0);

    const xTo = gsap.quickTo(content, "x", {
      duration: 1,
      ease: 'none',
      modifiers: {
        x: gsap.utils.unitize(wrap),
      },
    });

    const tick = () => {
      total -= 8 + wheelDelta * 1;
      xTo(total);

      wheelDelta *= 0.9;
      if (Math.abs(wheelDelta) < 0.01) wheelDelta = 0;
    };

    const handleWheel = (e: { deltaY: number; }) => {
      wheelDelta += e.deltaY * 0.08;
    };

    gsap.ticker.add(tick);
    window.addEventListener('wheel', handleWheel, { passive: true });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      gsap.ticker.remove(tick);
    };
  }, []);

  return (
    <section className="mwg_effect013 h-screen flex items-center justify-center">
      <div className="inner">
        <div className="banner-container" ref={containerRef}>
          <p className="phrase flex" ref={phraseRef} style={{ height: "500px" }}>
            {Array.from({ length: 10 }).map((_, index) => (
                <span key={index} className="phrase-item">
                    <img src={BF} alt="Banner" />
                </span>
            ))}
          </p>
        </div>
      </div>
    </section>
  );
}