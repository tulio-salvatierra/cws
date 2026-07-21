import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./Banner.css";

gsap.registerPlugin(ScrollTrigger);

const PHRASES = [
  "4 SIMPLE STEPS 🪜",
  "TO GROW YOUR BUSINESS 🚀",
] as const;

const REPEAT_COUNT = 50;
const SKEW_DEG = 8;

export default function Banner() {
  const sectionRef = useRef<HTMLElement>(null);
  const skewWrapper0Ref = useRef<HTMLDivElement>(null);
  const skewWrapper1Ref = useRef<HTMLDivElement>(null);
  const containerRef0 = useRef<HTMLDivElement>(null);
  const phraseRef0 = useRef<HTMLParagraphElement>(null);
  const containerRef1 = useRef<HTMLDivElement>(null);
  const phraseRef1 = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const initAnimation = (): (() => void) => {
      const section = sectionRef.current;
      const skew0 = skewWrapper0Ref.current;
      const skew1 = skewWrapper1Ref.current;
      const content0 = containerRef0.current;
      const phraseEl0 = phraseRef0.current;
      const content1 = containerRef1.current;
      const phraseEl1 = phraseRef1.current;

      if (!section || !skew0 || !skew1 || !content0 || !phraseEl0 || !content1 || !phraseEl1) {
        return () => {};
      }

      const phraseWidth0 = phraseEl0.clientWidth;
      const phraseWidth1 = phraseEl1.clientWidth;
      if (phraseWidth0 === 0 || phraseWidth1 === 0) {
        return () => {};
      }

      const triggers: ScrollTrigger[] = [];

      // Same as reference banner: x in [-phraseWidth, 0] for left scroll
      const wrapLeft = gsap.utils.wrap(-phraseWidth0, 0);
      // Opposite direction: x in [0, phraseWidth] so content moves right
      const wrapRight = gsap.utils.wrap(0, phraseWidth1);

      let total0 = 0;
      let total1 = 0;
      let wheelDelta = 0;

      const xTo0 = gsap.quickTo(content0, "x", {
        duration: 1,
        ease: "power2.inOut",
        modifiers: {
          x: gsap.utils.unitize(wrapLeft),
        },
      });

      const xTo1 = gsap.quickTo(content1, "x", {
        duration: 0.5,
        ease: "power2.inOut",
        modifiers: {
          x: gsap.utils.unitize(wrapRight),
        },
      });

      const tick = () => {
        total0 -= 4 + wheelDelta * 1;
        total1 += 4 + wheelDelta * 1;
        xTo0(total0);
        xTo1(total1);
        wheelDelta *= 0.1;
        if (Math.abs(wheelDelta) < 0.01) wheelDelta = 0;
      };

      const handleWheel = (e: { deltaY: number }) => {
        wheelDelta += e.deltaY * 0.04;
      };

      gsap.ticker.add(tick);
      window.addEventListener("wheel", handleWheel, { passive: true });

      // Scroll-driven skew: start at -8 / +8, end at +8 / -8
      const st0 = gsap.fromTo(
        skew0,
        { skewX: -SKEW_DEG },
        {
          skewX: SKEW_DEG,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        }
      );
      if (st0.scrollTrigger) triggers.push(st0.scrollTrigger);

      const st1 = gsap.fromTo(
        skew1,
        { skewX: SKEW_DEG },
        {
          skewX: -SKEW_DEG,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        }
      );
      if (st1.scrollTrigger) triggers.push(st1.scrollTrigger);

      return () => {
        window.removeEventListener("wheel", handleWheel);
        gsap.ticker.remove(tick);
        triggers.forEach((t) => t.kill());
      };
    };
    let cleanupFn: (() => void) | null = null;
    let attempts = 0;
    const maxAttempts = 5;

    const tryInit = () => {
      attempts++;
      cleanupFn = initAnimation();
      const ready =
        containerRef0.current &&
        phraseRef0.current &&
        phraseRef0.current.clientWidth > 0 &&
        containerRef1.current &&
        phraseRef1.current &&
        phraseRef1.current.clientWidth > 0;
      if (!ready && attempts < maxAttempts) {
        setTimeout(tryInit, 100 * attempts);
      }
    };

    const timeoutId = setTimeout(tryInit, 150);

    return () => {
      clearTimeout(timeoutId);
      cleanupFn?.();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="mwg_effect013 h-screen flex items-center justify-center overflow-hidden"
    >
      <div className="banner-wrapper w-full">
        <div className="inner flex flex-col gap-6 justify-center">
          {PHRASES.map((phrase, rowIndex) => {
            const containerRef = rowIndex === 0 ? containerRef0 : containerRef1;
            const phraseRef = rowIndex === 0 ? phraseRef0 : phraseRef1;
            const skewWrapperRef =
              rowIndex === 0 ? skewWrapper0Ref : skewWrapper1Ref;
            return (
              <div
                key={rowIndex}
                ref={skewWrapperRef}
                className="banner-row-wrapper"
              >
                <div
                  className="banner-container overflow-visible"
                  ref={containerRef}
                >
                  <p
                    className="phrase flex p-4 text-5xl md:text-6xl font-main text-zinc-800 items-center"
                    ref={phraseRef}
                  >
                    {Array.from({ length: REPEAT_COUNT }).map((_, i) => (
                      <span key={i} className="phrase-item">
                        {phrase}
                      </span>
                    ))}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
