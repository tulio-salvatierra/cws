import { useRef, useState, useCallback, useEffect, useLayoutEffect, type CSSProperties } from "react";
import { servicesData } from "../ServicesCard/servicesCardData";
import SectionIntro from "../SectionIntro/SectionIntro";
import navigateIcon from "../../assets/images/footer/navigate-icon.svg";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { createServicesScene, type ServicesScene } from "./ServicesScene";
import "./Services.css";

gsap.registerPlugin(ScrollTrigger);

/** Scroll distance per service step while pinned (fraction of viewport height). */
const STEP_SCROLL_VH = 0.55;
const ACCENT = "#d4610e";
const EYEBROW = "What we do";

type LenisLike = {
  on: (event: string, cb: () => void) => void;
  off: (event: string, cb: () => void) => void;
  scrollTo: (target: number, opts?: { duration?: number; immediate?: boolean }) => void;
};

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const pad = (n: number) => String(n).padStart(2, "0");

export default function Services() {
  const total = servicesData.length;
  const stepCount = Math.max(1, total - 1);
  const [activeIndex, setActiveIndex] = useState(0);
  const [sceneUnavailable, setSceneUnavailable] = useState(false);

  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const indicatorRef = useRef<HTMLLIElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const segRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const sceneRef = useRef<ServicesScene | null>(null);
  const posObj = useRef({ v: 0 });
  const pinTrigger = useRef<ScrollTrigger | null>(null);
  const hoverLockUntil = useRef(0);
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const activeIndexRef = useRef(0);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  /** Write a continuous service position (0..total-1) to the DOM + 3D scene. No React re-render per frame. */
  const applyPos = useCallback(
    (pos: number) => {
      const section = sectionRef.current;
      if (!section) return;
      section.style.setProperty("--pos", pos.toFixed(4));
      itemRefs.current.forEach((el, i) => {
        el?.style.setProperty("--a", clamp(1 - Math.abs(pos - i), 0, 1).toFixed(3));
      });
      segRefs.current.forEach((el, i) => {
        if (el) el.style.transform = `scaleX(${clamp(pos - i + 1, 0, 1)})`;
      });
      const i0 = clamp(Math.floor(pos), 0, total - 1);
      const i1 = Math.min(i0 + 1, total - 1);
      const a = itemRefs.current[i0], b = itemRefs.current[i1], ind = indicatorRef.current;
      if (a && b && ind) {
        const f = pos - i0;
        const h = lerp(a.offsetHeight, b.offsetHeight, f);
        ind.style.transform = `translateY(${lerp(a.offsetTop, b.offsetTop, f) + h * 0.18}px)`;
        ind.style.height = `${h * 0.64}px`;
      }
      sceneRef.current?.setPos(pos);
      const idx = Math.round(pos);
      if (activeIndexRef.current !== idx) {
        activeIndexRef.current = idx;
        setActiveIndex(idx);
      }
    },
    [total],
  );

  /** Hover / click / focus: on desktop scroll the pinned section to that step; on mobile tween directly. */
  const goTo = useCallback(
    (index: number, fromHover = false) => {
      // Scrolling can move another row under a stationary pointer.
      if (fromHover && performance.now() < hoverLockUntil.current) return;
      hoverLockUntil.current = performance.now() + (reducedMotion ? 0 : 1600);
      const st = pinTrigger.current;
      if (st) {
        const y = st.start + (index / stepCount) * (st.end - st.start);
        const lenis = (window as typeof window & { lenis?: LenisLike }).lenis;
        if (lenis) lenis.scrollTo(y, { duration: reducedMotion ? 0 : 0.9, immediate: reducedMotion });
        else window.scrollTo({ top: y, behavior: reducedMotion ? "auto" : "smooth" });
        return;
      }
      gsap.to(posObj.current, {
        v: index,
        duration: reducedMotion ? 0 : 0.7,
        ease: "power3.inOut",
        overwrite: true,
        onUpdate: () => applyPos(posObj.current.v),
      });
    },
    [stepCount, applyPos, reducedMotion],
  );

  // three.js stage: only renders while on screen
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let scene: ServicesScene;
    try {
      scene = createServicesScene(canvas, { accent: ACCENT, reducedMotion });
      setSceneUnavailable(false);
    } catch {
      setSceneUnavailable(true);
      return;
    }
    sceneRef.current = scene;
    scene.setPos(posObj.current.v);
    if (reducedMotion) scene.setReveal(1);

    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !reducedMotion) scene.start();
      else scene.stop();
    });
    io.observe(canvas);
    const ro = new ResizeObserver(() => scene.resize());
    ro.observe(canvas);

    return () => {
      io.disconnect();
      ro.disconnect();
      scene.dispose();
      sceneRef.current = null;
    };
  }, [reducedMotion]);

  useGSAP(
    () => {
      const track = trackRef.current;
      const pin = pinRef.current;
      if (!track || !pin) return;

      applyPos(posObj.current.v);

      // ---- Entrance (plays once when the section arrives) ----
      if (!reducedMotion) {
        const reveal = { v: 0 };
        const tl = gsap.timeline({
          paused: true,
          defaults: { ease: "expo.out" },
        });
        tl.from(".services-section__icon", { scale: 0, rotate: -180, duration: 0.9, ease: "back.out(1.7)" })
          .from(".services-section__eyebrow-char", { yPercent: 110, duration: 0.7, stagger: 0.025 }, 0.15)
          .from(".services-section__list-label", { yPercent: 120, skewY: 4, duration: 1.1, stagger: 0.1 }, 0.3)
          .from(".services-section__indicator-bar", { scaleY: 0, duration: 0.6, ease: "power3.inOut" }, 1.1)
          .fromTo(
            ".services-section__card",
            { clipPath: "inset(100% 0% 0% 0% round 24px)", y: 60, rotate: 3 },
            { clipPath: "inset(0% 0% 0% 0% round 24px)", y: 0, rotate: 0, duration: 1.3 },
            0.4,
          )
          .to(reveal, { v: 1, duration: 0.9, ease: "power2.inOut", onUpdate: () => sceneRef.current?.setReveal(reveal.v) }, 1.0)
          .from(".services-section__card-head, .services-section__segments", { autoAlpha: 0, y: 10, duration: 0.6 }, 1.2);

        ScrollTrigger.create({
          trigger: track,
          start: "top 70%",
          once: true,
          onEnter: () => tl.play(),
        });
      }

      const mm = gsap.matchMedia();

      // ---- Desktop: pin + scroll-scrubbed continuous position ----
      mm.add("(min-width: 992px)", () => {
        const lenis = (window as typeof window & { lenis?: LenisLike }).lenis;
        const syncScroll = () => ScrollTrigger.update();
        lenis?.on("scroll", syncScroll);

        const tween = gsap.fromTo(
          posObj.current,
          { v: 0 },
          {
            v: stepCount,
            ease: "none",
            onUpdate: () => applyPos(posObj.current.v),
            scrollTrigger: {
              trigger: track,
              start: "top top",
              end: () => `+=${stepCount * window.innerHeight * STEP_SCROLL_VH}`,
              pin,
              pinSpacing: true,
              scrub: reducedMotion ? true : 0.8,
              anticipatePin: 1,
              invalidateOnRefresh: true,
              snap: reducedMotion ? undefined : { snapTo: 1 / stepCount, inertia: false, directional: false, duration: { min: 0.2, max: 0.45 }, delay: 0.05, ease: "power2.inOut" },
            },
          },
        );
        pinTrigger.current = tween.scrollTrigger ?? null;
        ScrollTrigger.refresh();

        return () => {
          lenis?.off("scroll", syncScroll);
          pinTrigger.current = null;
          tween.scrollTrigger?.kill();
          tween.kill();
        };
      });

      // ---- Mobile: no pin, each row activates as it crosses the middle ----
      mm.add("(max-width: 991px)", () => {
        const items = gsap.utils.toArray<HTMLElement>(".services-section__list-button", pin);
        const triggers = items.map((item, index) =>
          ScrollTrigger.create({
            trigger: item,
            start: "top 55%",
            end: "bottom 45%",
            onEnter: () => goTo(index),
            onEnterBack: () => goTo(index),
          }),
        );
        return () => {
          triggers.forEach((t) => t.kill());
          gsap.killTweensOf(posObj.current);
        };
      });

      const onResize = () => applyPos(posObj.current.v);
      window.addEventListener("resize", onResize);

      return () => {
        gsap.killTweensOf(posObj.current);
        window.removeEventListener("resize", onResize);
        mm.revert();
      };
    },
    { scope: sectionRef, dependencies: [stepCount, applyPos, goTo, reducedMotion], revertOnUpdate: true },
  );

  return (
    <section
      id="services"
      ref={sectionRef}
      className="services-section"
      style={{ "--accent": ACCENT, "--pos": 0 } as CSSProperties}
    >
      <SectionIntro title="SERVICES" id="services-intro" />

      <div ref={trackRef} className="services-section__track">
        <div ref={pinRef} className="services-section__pin">
          <div className="services-section__inner">
            <div className="services-section__header">
              <span className="services-section__icon" aria-hidden="true">
                <img src={navigateIcon} alt="" />
              </span>
              <p className="services-section__eyebrow" aria-label={EYEBROW}>
                {EYEBROW.split("").map((c, i) => (
                  <span key={i} className="services-section__eyebrow-char" aria-hidden="true">
                    {c === " " ? "\u00A0" : c}
                  </span>
                ))}
              </p>
            </div>

            <div className="services-section__body">
              <ul className="services-section__list" aria-label="Services">
                <li ref={indicatorRef} className="services-section__indicator" aria-hidden="true">
                  <span className="services-section__indicator-bar" />
                </li>
                {servicesData.map((service, index) => (
                  <li key={service.id} className="services-section__list-item">
                    <button
                      ref={(el) => { itemRefs.current[index] = el; }}
                      type="button"
                      className={`services-section__list-button${index === activeIndex ? " is-active" : ""}`}
                      style={{ "--a": index === 0 ? 1 : 0 } as CSSProperties}
                      onMouseEnter={() => goTo(index, true)}
                      onFocus={() => goTo(index)}
                      onClick={() => goTo(index)}
                      aria-current={index === activeIndex ? "true" : undefined}
                    >
                      <span className="services-section__list-mask">
                        <span className="services-section__list-label">
                          {service.title}
                          <sup className="services-section__list-index" aria-hidden="true">{pad(index + 1)}</sup>
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>

              <div className="services-section__card">
                <div className="services-section__card-head" aria-hidden="true">
                  <div className="services-section__roll">
                    <div className="services-section__roll-track">
                      {servicesData.map((s) => (
                        <span key={s.id} className="services-section__roll-item">{s.title}</span>
                      ))}
                    </div>
                  </div>
                  <div className="services-section__roll services-section__roll--count">
                    <div className="services-section__roll-track">
                      {servicesData.map((s, i) => (
                        <span key={s.id} className="services-section__roll-item">
                          {pad(i + 1)} / {pad(total)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="services-section__stage">
                  {sceneUnavailable && <span className="services-section__fallback">{servicesData[activeIndex].title}</span>}
                  <span className="services-section__shadow" aria-hidden="true" />
                  <canvas ref={canvasRef} className="services-section__canvas" aria-hidden="true" />
                </div>

                <div className="services-section__segments" aria-hidden="true">
                  {servicesData.map((s, i) => (
                    <span key={s.id} className="services-section__segment">
                      <span ref={(el) => { segRefs.current[i] = el; }} className="services-section__segment-fill" />
                    </span>
                  ))}
                </div>

                <p className="services-section__sr" aria-live="polite">
                  {servicesData[activeIndex].title}: {servicesData[activeIndex].description}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
