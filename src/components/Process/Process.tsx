import { useRef, useState, useCallback } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { processSteps } from "./processData";
import ProcessStepMedia from "./ProcessStepMedia";
import SectionIntro from "../SectionIntro/SectionIntro";
import "./Process.css";

gsap.registerPlugin(ScrollTrigger);

function formatStepLabel(step: string) {
  return `STEP • ${step}`;
}

export default function Process() {
  const total = processSteps.length;
  const [activeIndex, setActiveIndex] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const stepRefs = useRef<(HTMLElement | null)[]>([]);

  const setActive = useCallback((index: number) => {
    const next = Math.max(0, Math.min(total - 1, index));
    setActiveIndex((current) => (current === next ? current : next));
  }, [total]);

  useGSAP(
    () => {
      const lenis = (
        window as typeof window & {
          lenis?: {
            on: (event: string, cb: () => void) => void;
            off: (event: string, cb: () => void) => void;
          };
        }
      ).lenis;
      const syncScroll = () => ScrollTrigger.update();

      if (lenis) {
        lenis.on("scroll", syncScroll);
      }

      const triggers = stepRefs.current
        .map((step, index) => {
          if (!step) return null;

          return ScrollTrigger.create({
            trigger: step,
            start: "top 55%",
            end: "bottom 45%",
            onEnter: () => setActive(index),
            onEnterBack: () => setActive(index),
          });
        })
        .filter(Boolean) as ScrollTrigger[];

      ScrollTrigger.refresh();

      return () => {
        if (lenis) {
          lenis.off("scroll", syncScroll);
        }
        triggers.forEach((trigger) => trigger.kill());
      };
    },
    { scope: sectionRef, dependencies: [total, setActive] },
  );

  return (
    <section id="process" ref={sectionRef} className="process-section">
      <SectionIntro title="PROCESS" id="process-intro" />

      <div className="process-section__stage">
        <div className="process-section__copy">
          {processSteps.map((item, index) => (
            <article
              key={item.id}
              ref={(node) => {
                stepRefs.current[index] = node;
              }}
              className={`process-step-block${
                index === activeIndex ? " is-active" : ""
              }`}
            >
              <p className="process-step__label">{formatStepLabel(item.step)}</p>
              <h3 className="process-step__title">{item.title}</h3>
              <p className="process-step__description">{item.description}</p>

              <div className="process-section__media-inline">
                <ProcessStepMedia
                  video={item.video}
                  poster={item.poster}
                  isActive={index === activeIndex}
                />
              </div>
            </article>
          ))}
        </div>

        <div className="process-section__media-sticky" aria-hidden={false}>
          <div className="process-section__media-frame">
            {processSteps.map((item, index) => (
              <div
                key={item.id}
                className={`process-section__media-pane${
                  index === activeIndex ? " is-active" : ""
                }`}
                aria-hidden={index !== activeIndex}
              >
                <ProcessStepMedia
                  video={item.video}
                  poster={item.poster}
                  isActive={index === activeIndex}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
