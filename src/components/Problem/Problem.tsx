import { useRef } from "react";
import { PHONE } from "../../Constants/Constants";
import MaskedLines from "../MaskedLines/MaskedLines";
import CustomButton from "../CustomButton";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import gsap from "gsap";
import logoCicero from "../../assets/images/problem/cicero.svg";
import problemDivider from "../../assets/images/problem/divider.svg";
import workspacePhoto from "../../assets/images/problem/workspace.webp";
import "./Problem.css";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const ES_LABEL = "[HABLAMOS ESPAÑOL]";
const ES_REPEAT_COUNT = 16;

function formatPhone(phone: number) {
  const digits = String(phone);
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}

/** Infinite ES marquee with light wheel boost. Returns cleanup. */
function createEsMarquee(track: HTMLElement, phrase: HTMLElement) {
  const phraseWidth = phrase.scrollWidth / 2;
  if (!phraseWidth) return () => {};

  const wrapX = gsap.utils.wrap(-phraseWidth, 0);
  let wheelDelta = 0;
  let total = 0;

  const xTo = gsap.quickTo(track, "x", {
    duration: 0.5,
    ease: "none",
    modifiers: { x: gsap.utils.unitize(wrapX) },
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
}

export default function Problem() {
  const sectionRef = useRef<HTMLElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const esTrackRef = useRef<HTMLDivElement>(null);
  const esPhraseRef = useRef<HTMLParagraphElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const showcaseRef = useRef<HTMLDivElement>(null);
  const showcaseMediaRef = useRef<HTMLDivElement>(null);
  const showcaseImageRef = useRef<HTMLImageElement>(null);
  const showcaseOverlayRef = useRef<HTMLDivElement>(null);
  const showcaseContentRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const track = esTrackRef.current;
      const phrase = esPhraseRef.current;
      const disposeMarquee =
        track && phrase ? createEsMarquee(track, phrase) : undefined;

      const intro = gsap.timeline({
        defaults: { ease: "expo.out" },
      });

      intro
        .from(logoRef.current, {
          yPercent: 40,
          opacity: 0,
          duration: 1.1,
          delay: 0.2,
        })
        .from(
          esTrackRef.current,
          { y: 12, opacity: 0, duration: 0.8, ease: "power2.out" },
          "-=0.5",
        )
        .from(copyRef.current, { y: 30, opacity: 0, duration: 1 }, "-=0.6");

      const showcase = showcaseRef.current;
      const media = showcaseMediaRef.current;
      const image = showcaseImageRef.current;
      const overlay = showcaseOverlayRef.current;
      const content = showcaseContentRef.current;
      const textItems = content
        ? gsap.utils.toArray<HTMLElement>(
            content.querySelectorAll(
              ".problem-section__name, .problem-section__role, .problem-section__cta",
            ),
          )
        : [];

      // Reference motion: colored panel rises → image settles from zoom → copy eases up.
      if (showcase && media && image) {
        gsap.set(media, { yPercent: 110 });
        gsap.set(image, { scale: 1.35, transformOrigin: "50% 50%" });
        gsap.set(overlay, { opacity: 0 });
        if (textItems.length) {
          gsap.set(textItems, { y: 56, opacity: 0 });
        }

        const reveal = gsap.timeline({
          defaults: { ease: "power3.out" },
          scrollTrigger: {
            trigger: showcase,
            start: "top 100%",
            once: true,
          },
        });

        reveal
          .to(media, {
            yPercent: 0,
            duration: 1.35,
            ease: "power4.out",
          })
          .to(
            image,
            {
              scale: 1,
              duration: 1.9,
              ease: "power3.out",
            },
            0.12,
          )
          .to(
            overlay,
            {
              opacity: 1,
              duration: 1.1,
              ease: "power2.out",
            },
            0.35,
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

      return () => {
        disposeMarquee?.();
      };
    },
    { scope: sectionRef },
  );

  return (
    <section ref={sectionRef} id="problem" className="problem-section">
      <div className="problem-section__inner">
        <div className="problem-section__main">
          <div className="problem-section__brand">
            <div
              ref={logoRef}
              className="problem-section__logo"
              aria-label="Cicero Web Studio"
            >
              <img src={logoCicero} alt="Cicero Web Studio" />
            </div>

            <div className="problem-section__es" aria-hidden="true">
              <div ref={esTrackRef} className="problem-section__es-track">
                <p ref={esPhraseRef} className="problem-section__es-phrase">
                  {Array.from({ length: ES_REPEAT_COUNT * 2 }, (_, index) => (
                    <span key={index}>{ES_LABEL}</span>
                  ))}
                </p>
              </div>
            </div>
          </div>

          <div ref={copyRef} className="problem-section__copy">
            <MaskedLines as="p" scroll scrollStart="top 100%">
              I&apos;m Tulio, a local developer with a passion for web design,
              development, music, creativity, and technology. I help small
              businesses in the Chicagoland area create a solid online presence.
            </MaskedLines>
            <MaskedLines as="p" scroll scrollStart="top 100%">
              Whether you need a website built from scratch, improvements to an
              existing site, branded photo and video content, or custom AI
              automation to save time and reduce costs, my goal is to help your
              business look more professional, work more efficiently, and grow
              with confidence.
            </MaskedLines>
          </div>
        </div>

        <div className="problem-image-container">
          <img
            src={problemDivider}
            alt=""
            className="problem-section__divider grain"
            aria-hidden="true"
          />
        </div>

        <div ref={showcaseRef} className="problem-section__showcase">
          <div
            ref={showcaseMediaRef}
            className="problem-section__showcase-image-container"
          >
            <img
              ref={showcaseImageRef}
              src={workspacePhoto}
              alt="Tulio Salvatierra in his workspace"
              className="problem-section__showcase-image"
            />
          </div>
          <div
            ref={showcaseOverlayRef}
            className="problem-section__showcase-overlay"
            aria-hidden="true"
          />

          <div
            ref={showcaseContentRef}
            className="problem-section__showcase-content"
          >
            <h2 className="problem-section__name">Tulio Salvatierra</h2>
            <p className="problem-section__role">Founder - Web Developer</p>
            <CustomButton
              label={formatPhone(PHONE)}
              href={`tel:+1${PHONE}`}
              variant="accent"
              className="problem-section__cta"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
