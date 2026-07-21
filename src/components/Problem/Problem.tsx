import { useRef } from "react";
import { PHONE } from "../../Constants/Constants";
import MaskedLines from "../MaskedLines/MaskedLines";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import logoCicero from "../../assets/images/problem/cicero.svg";
import logoWeb from "../../assets/images/problem/web.svg";
import logoStudio from "../../assets/images/problem/studio.svg";
import problemDivider from "../../assets/images/problem/divider.svg";
import workspacePhoto from "../../assets/images/problem/workspace.jpg";
import "./Problem.css";

const ES_LABEL = "[HABLAMOS ESPAÑOL]";
const ES_REPEAT_COUNT = 16;

function formatPhone(phone: number) {
  const digits = String(phone);
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export default function Problem() {
  const sectionRef = useRef<HTMLElement>(null);
  const esTrackRef = useRef<HTMLDivElement>(null);
  const esPhraseRef = useRef<HTMLParagraphElement>(null);

  useGSAP(
    () => {
      const track = esTrackRef.current;
      const phrase = esPhraseRef.current;
      if (!track || !phrase) return;

      const phraseWidth = phrase.scrollWidth / 2;
      if (!phraseWidth) return;

      const wrapX = gsap.utils.wrap(-phraseWidth, 0);
      let wheelDelta = 0;
      let total = 0;

      const xTo = gsap.quickTo(track, "x", {
        duration: 0.5,
        ease: "none",
        modifiers: {
          x: gsap.utils.unitize(wrapX),
        },
      });

      const tick = () => {
        total -= 2 + wheelDelta;
        xTo(total);
        wheelDelta *= 0.1;
        if (Math.abs(wheelDelta) < 0.01) wheelDelta = 0;
      };

      const onWheel = (event: WheelEvent) => {
        wheelDelta += event.deltaY * 0.04;
      };

      gsap.ticker.add(tick);
      window.addEventListener("wheel", onWheel, { passive: true });

      return () => {
        gsap.ticker.remove(tick);
        window.removeEventListener("wheel", onWheel);
      };
    },
    { scope: sectionRef },
  );

  useGSAP(
    () => {
      gsap.from(".problem-section__logo img", {
        yPercent: 40,
        opacity: 0,
        duration: 1.1,
        stagger: 0.12,
        ease: "expo.out",
        delay: 0.2,
      });

      gsap.from(".problem-section__es-track", {
        opacity: 0,
        y: 12,
        duration: 0.8,
        ease: "power2.out",
        delay: 0.6,
      });

      gsap.from(".problem-section__copy", {
        y: 30,
        opacity: 0,
        duration: 1,
        ease: "expo.out",
        delay: 0.5,
      });

      gsap.from(".problem-section__showcase-content", {
        y: 40,
        opacity: 0,
        duration: 1,
        ease: "expo.out",
        delay: 0.8,
      });
    },
    { scope: sectionRef },
  );

  return (
    <section ref={sectionRef} id="problem" className="problem-section">
      <div className="problem-section__inner">
        <div className="problem-section__main">
          <div className="problem-section__brand">
            <div
              className="problem-section__logo"
              aria-label="Cicero Web Studio"
            >
              <img className="w-inherit h-inherit" src={logoCicero} alt="Cicero" />
              <img className="w-inherit h-inherit" src={logoWeb} alt="Web" />
              <img className="w-inherit h-inherit" src={logoStudio} alt="Studio" />
            </div>

            <div className="problem-section__es" aria-hidden="true">
              <div ref={esTrackRef} className="problem-section__es-track">
                <p ref={esPhraseRef} className="problem-section__es-phrase">
                  {Array.from({ length: ES_REPEAT_COUNT * 2 }, (_, index) => (
                    <span className="text-white text-2xl" key={index}>{ES_LABEL}</span>
                  ))}
                </p>
              </div>
            </div>
          </div>

          <div className="problem-section__copy">
            <MaskedLines as="p" scroll scrollStart="top 85%">
              I&apos;m Tulio, a local developer with a passion for web design,
              development, music, creativity, and technology. I help small
              businesses in the Chicagoland area create a solid online presence.
            </MaskedLines>
            <MaskedLines as="p" scroll scrollStart="top 85%">
              Whether you need a website built from scratch, improvements to an
              existing site, branded photo and video content, or custom AI
              automation to save time and reduce costs, my goal is to help your
              business look more professional, work more efficiently, and grow
              with confidence.
            </MaskedLines>
          </div>
        </div>

        <img
          src={problemDivider}
          alt=""
          className="problem-section__divider grain"
          aria-hidden="true"
        />

        <div className="problem-section__showcase">
          <img
            src={workspacePhoto}
            alt="Tulio Salvatierra in his workspace"
            className="problem-section__showcase-image"
          />
          <div className="problem-section__showcase-overlay" aria-hidden="true" />

          <div className="problem-section__showcase-content">
            <h2 className="problem-section__name">Tulio Salvatierra</h2>
            <p className="problem-section__role">Founder - Web Developer</p>
            <a href={`tel:+1${PHONE}`} className="problem-section__cta">
              {formatPhone(PHONE)}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
