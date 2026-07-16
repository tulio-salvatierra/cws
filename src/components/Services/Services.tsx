import { useRef, useState, useCallback } from "react";
import { servicesData } from "../ServicesCard/servicesCardData";
import LottieAnimation from "../ServicesCard/lotties/Lottie";
import SectionIntro from "../SectionIntro/SectionIntro";
import navigateIcon from "../../assets/images/footer/navigate-icon.svg";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./Services.css";

gsap.registerPlugin(ScrollTrigger);

/** Scroll distance per service step while pinned (fraction of viewport height). */
const STEP_SCROLL_VH = 0.14;

export default function Services() {
  const total = servicesData.length;
  const [activeIndex, setActiveIndex] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);

  const setActive = useCallback((index: number) => {
    const next = Math.max(0, Math.min(total - 1, index));
    setActiveIndex((current) => (current === next ? current : next));
  }, [total]);

  useGSAP(
    () => {
      const track = trackRef.current;
      const pin = pinRef.current;
      if (!track || !pin) return;

      const mm = gsap.matchMedia();

      mm.add("(min-width: 992px)", () => {
        const lenis = (window as typeof window & { lenis?: { on: (event: string, cb: () => void) => void; off: (event: string, cb: () => void) => void } }).lenis;
        const syncScroll = () => ScrollTrigger.update();

        if (lenis) {
          lenis.on("scroll", syncScroll);
        }

        const stepCount = Math.max(1, total - 1);
        const pinScrollDistance = stepCount * window.innerHeight * STEP_SCROLL_VH;

        const st = ScrollTrigger.create({
          trigger: track,
          start: "top top",
          end: () => `+=${pinScrollDistance}`,
          pin,
          pinSpacing: true,
          scrub: 0.35,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          snap:
            stepCount > 1
              ? {
                  snapTo: 1 / stepCount,
                  duration: { min: 0.12, max: 0.28 },
                  delay: 0,
                }
              : undefined,
          onUpdate: (self) => {
            const index = Math.round(self.progress * stepCount);
            setActive(index);
          },
        });

        ScrollTrigger.refresh();

        return () => {
          if (lenis) {
            lenis.off("scroll", syncScroll);
          }
          st.kill();
        };
      });

      mm.add("(max-width: 991px)", () => {
        const items = gsap.utils.toArray<HTMLElement>(
          ".services-section__list-button",
          pin,
        );

        const triggers = items.map((item, index) =>
          ScrollTrigger.create({
            trigger: item,
            start: "top 55%",
            end: "bottom 45%",
            onEnter: () => setActive(index),
            onEnterBack: () => setActive(index),
          }),
        );

        return () => triggers.forEach((trigger) => trigger.kill());
      });

      return () => mm.revert();
    },
    { scope: sectionRef, dependencies: [total, setActive] },
  );

  return (
    <section id="services" ref={sectionRef} className="services-section">
      <SectionIntro title="SERVICES" id="services-intro" />

      <div ref={trackRef} className="services-section__track">
        <div ref={pinRef} className="services-section__pin">
          <div className="services-section__inner">
            <div className="services-section__header">
              <img
                src={navigateIcon}
                alt=""
                className="services-section__icon"
                width={24}
                height={23}
                aria-hidden="true"
              />
              <p className="services-section__eyebrow">What we do</p>
            </div>

            <div className="services-section__body">
              <ul className="services-section__list" aria-label="Services">
                {servicesData.map((service, index) => (
                  <li key={service.id} className="services-section__list-item">
                    <button
                      type="button"
                      className={`services-section__list-button${
                        index === activeIndex ? " is-active" : ""
                      }`}
                      onMouseEnter={() => setActive(index)}
                      onFocus={() => setActive(index)}
                      onClick={() => setActive(index)}
                      aria-current={index === activeIndex ? "true" : undefined}
                    >
                      {service.title}
                    </button>
                  </li>
                ))}
              </ul>

              <div className="services-section__preview" aria-live="polite">
                {servicesData.map((service, index) => (
                  <div
                    key={service.id}
                    className={`services-section__preview-pane${
                      index === activeIndex ? " is-active" : ""
                    }`}
                    aria-hidden={index !== activeIndex}
                  >
                    {service.image ? (
                      <LottieAnimation path={service.image} />
                    ) : (
                      <div className="services-section__preview-fallback" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
