import { useRef } from "react";
import { PHONE } from "../../Constants/Constants";
import MaskedLines from "../MaskedLines/MaskedLines";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import logoCicero from "../../assets/Images/hero/cicero-web-studio.svg";

import problemDivider from "../../assets/Images/problem/divider.svg";
import workspacePhoto from "../../assets/Images/problem/workspace.jpg";
import "./Problem.css";

gsap.registerPlugin(ScrollTrigger);

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
  const showcaseRef = useRef<HTMLDivElement>(null);

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

      const showcase = showcaseRef.current;
      if (!showcase) return;

      const image = showcase.querySelector<HTMLElement>(
        ".problem-section__showcase-image",
      );
      const overlay = showcase.querySelector<HTMLElement>(
        ".problem-section__showcase-overlay",
      );
      const contentItems = gsap.utils.toArray<HTMLElement>([
        ".problem-section__name",
        ".problem-section__role",
        ".problem-section__cta",
      ]);

      if (!image) return;

      const mm = gsap.matchMedia();

      mm.add(
        {
          isDesktop: "(min-width: 992px)",
          isMobile: "(max-width: 991px)",
        },
        (context) => {
          const { isDesktop } = context.conditions as {
            isDesktop: boolean;
            isMobile: boolean;
          };

          gsap.set(image, {
            opacity: 0,
            scale: 1.3,
            yPercent: 18,
            transformOrigin: isDesktop ? "center center" : "left center",
          });
          gsap.set(overlay, { opacity: 0 });
          gsap.set(contentItems, { opacity: 0, y: 48 });

          const tl = gsap.timeline({
            defaults: { ease: "power3.out" },
            scrollTrigger: {
              trigger: showcase,
              start: "top 90%",
              once: true,
            },
          });

          tl.to(image, {
            opacity: 1,
            scale: 1,
            yPercent: 0,
            duration: 1.35,
          })
            .to(
              overlay,
              {
                opacity: 1,
                duration: 0.7,
              },
              "-=0.85",
            )
            .to(
              contentItems,
              {
                opacity: 1,
                y: 0,
                duration: 0.9,
                stagger: 0.14,
              },
              "-=0.4",
            );

          return () => {
            tl.kill();
          };
        },
      );

      return () => mm.revert();
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
              <img
                className="problem-section__logo-image"
                src={logoCicero}
                alt="Cicero Web Studio"
              />
            </div>

            <div className="problem-section__es" aria-hidden="true">
              <div ref={esTrackRef} className="problem-section__es-track">
                <p ref={esPhraseRef} className="problem-section__es-phrase">
                  {Array.from({ length: ES_REPEAT_COUNT * 2 }, (_, index) => (
                    <span className="text-white text-2xl" key={index}>
                      {ES_LABEL}
                    </span>
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

        <div ref={showcaseRef} className="problem-section__showcase">
          <div className="problem-section__showcase-media">
            <img
              src={workspacePhoto}
              alt="Tulio Salvatierra in his workspace"
              className="problem-section__showcase-image"
            />
            <div
              className="problem-section__showcase-overlay"
              aria-hidden="true"
            />
          </div>

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
