import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import gsap from "gsap";
import { processSteps } from "./processData";
import ProcessStepMedia from "./ProcessStepMedia";
import SectionIntro from "../SectionIntro/SectionIntro";
import "./Process.css";

gsap.registerPlugin(useGSAP, ScrollTrigger);

function formatStepLabel(step: string) {
  return `STEP • ${step}`;
}

/** Same reveal as Problem/Projects: panel rises → media scales to 1 → copy eases up. */
function createStepReveal(step: HTMLElement) {
  const mediaPanel = step.querySelector<HTMLElement>(".process-step__media-panel");
  const mediaStack = step.querySelector<HTMLElement>(
    ".process-section__media-stack",
  );
  const textItems = gsap.utils.toArray<HTMLElement>(
    step.querySelectorAll(
      ".process-step__label, .process-step__title, .process-step__description",
    ),
  );

  if (!mediaPanel || !mediaStack) return;

  gsap.set(mediaPanel, { yPercent: 110 });
  gsap.set(mediaStack, { scale: 1.35, transformOrigin: "50% 50%" });
  if (textItems.length) {
    gsap.set(textItems, { y: 56, opacity: 0 });
  }

  const reveal = gsap.timeline({
    defaults: { ease: "power3.out" },
    scrollTrigger: {
      trigger: step,
      start: "top 85%",
      once: true,
    },
  });

  reveal
    .to(mediaPanel, {
      yPercent: 0,
      duration: 1.35,
      ease: "power4.out",
    })
    .to(
      mediaStack,
      {
        scale: 1,
        duration: 1.9,
        ease: "power3.out",
      },
      0.12,
    )
    .to(
      textItems,
      {
        y: 0,
        opacity: 1,
        duration: 1,
        stagger: 0.12,
        ease: "power3.out",
      },
      0.55,
    );
}

export default function Process() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.utils
        .toArray<HTMLElement>(".process-step-block")
        .forEach(createStepReveal);
    },
    { scope: sectionRef },
  );

  return (
    <section ref={sectionRef} id="process" className="process-section">
      <SectionIntro title="PROCESS" id="process-intro" />

      <div className="process-section__stage">
        {processSteps.map((item) => (
          <article key={item.id} className="process-step-block">
            <div className="process-step__copy">
              <p className="process-step__label">{formatStepLabel(item.step)}</p>
              <h3 className="process-step__title">{item.title}</h3>
              <p className="process-step__description">{item.description}</p>
            </div>

            <div className="process-step__media">
              <div className="process-step__media-panel">
                <ProcessStepMedia video={item.video} poster={item.poster} />
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
