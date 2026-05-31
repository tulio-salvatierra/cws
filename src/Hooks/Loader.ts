import { useEffect, type RefObject } from "react";
import gsap from "gsap";

type LoaderAnimationOptions = {
  onComplete?: () => void;
  containerRef: RefObject<HTMLDivElement | null>;
  screenRef: RefObject<HTMLDivElement | null>;
  logoRef: RefObject<HTMLImageElement | null>;
  countRef: RefObject<HTMLParagraphElement | null>;
};

const SPEED = 1.15;

const MIN_DISPLAY_MS = Math.round(900 * SPEED);
const PROGRESS_CAP_BEFORE_LOAD = 92;
const LOGO_IN_DURATION = 0.75 * SPEED;
const COUNT_IN_DURATION = 0.45 * SPEED;
const COUNT_IN_OVERLAP = 0.4 * SPEED;
const PROGRESS_TO_CAP_MS = Math.round(1400 * SPEED);
const PROGRESS_TO_FULL_MS = Math.round(350 * SPEED);
const EXIT_DURATION = 0.85 * SPEED;

function waitForPageLoad(): Promise<void> {
  if (typeof document === "undefined") return Promise.resolve();
  if (document.readyState === "complete") return Promise.resolve();

  return new Promise((resolve) => {
    window.addEventListener("load", () => resolve(), { once: true });
  });
}

export function useLoaderAnimation({
  onComplete,
  containerRef,
  screenRef,
  logoRef,
  countRef,
}: LoaderAnimationOptions) {
  useEffect(() => {
    const container = containerRef.current;
    const screen = screenRef.current;
    const logo = logoRef.current;
    const countEl = countRef.current;
    if (!container || !screen || !logo || !countEl) return;

    let progress = 0;
    let rafId = 0;
    let cancelled = false;

    const setCount = (value: number) => {
      countEl.textContent = String(Math.min(100, Math.round(value)));
    };

    const runProgress = (target: number, durationMs: number) =>
      new Promise<void>((resolve) => {
        const start = progress;
        const startTime = performance.now();

        const tick = (now: number) => {
          if (cancelled) return;
          const t = Math.min(1, (now - startTime) / durationMs);
          const eased = 1 - Math.pow(1 - t, 3);
          progress = start + (target - start) * eased;
          setCount(progress);

          if (t < 1) {
            rafId = requestAnimationFrame(tick);
          } else {
            progress = target;
            setCount(progress);
            resolve();
          }
        };

        rafId = requestAnimationFrame(tick);
      });

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
      });

      tl.fromTo(
        logo,
        { opacity: 0, y: 36, scale: 0.97 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: LOGO_IN_DURATION,
          ease: "power3.out",
        },
      );
      tl.fromTo(
        countEl,
        { opacity: 0, y: 12 },
        {
          opacity: 1,
          y: 0,
          duration: COUNT_IN_DURATION,
          ease: "power2.out",
        },
        `-=${COUNT_IN_OVERLAP}`,
      );

      const minDisplayPromise = new Promise<void>((resolve) => {
        setTimeout(resolve, MIN_DISPLAY_MS);
      });

      const loadPromise = waitForPageLoad();

      Promise.all([
        minDisplayPromise,
        loadPromise,
        runProgress(PROGRESS_CAP_BEFORE_LOAD, PROGRESS_TO_CAP_MS),
      ])
        .then(() => {
          if (cancelled) return;
          return runProgress(100, PROGRESS_TO_FULL_MS);
        })
        .then(() => {
          if (cancelled) return;

          tl.to(screen, {
            yPercent: -100,
            duration: EXIT_DURATION,
            ease: "power3.inOut",
            onComplete: () => {
              container.setAttribute("aria-hidden", "true");
              container.setAttribute("aria-busy", "false");
              onComplete?.();
            },
          });
        });
    }, container);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      ctx.revert();
    };
  }, [onComplete, containerRef, screenRef, logoRef, countRef]);
}
