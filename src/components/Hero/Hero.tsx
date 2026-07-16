import { useRef } from "react";
import { PHONE } from "../../Constants/Constants";
import { useLoaderReady } from "../../context/LoaderContext";
import { waitForAppFonts } from "../../lib/waitForAppFonts";
import CustomButton from "../CustomButton";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { SplitText } from "gsap/SplitText";
import "./Hero.css";

gsap.registerPlugin(SplitText);

export default function Hero() {
  const heroRef = useRef<HTMLElement | null>(null);
  const { heroReady } = useLoaderReady();

  useGSAP(
    () => {
      if (!heroReady) return;

      let cancelled = false;
      let headlineSplit: SplitText | null = null;
      let subcopySplit: SplitText | null = null;

      const runAnimations = () => {
        headlineSplit = new SplitText(".hero-headline", {
          type: "chars, words",
          charsClass: "char-js",
          wordsClass: "word-js",
        });

        gsap.from(headlineSplit.chars, {
          yPercent: 110,
          opacity: 0,
          duration: 1.2,
          stagger: 0.02,
          ease: "expo.out",
          delay: 0.4,
        });

        subcopySplit = new SplitText(".hero-subcopy", {
          type: "words, lines",
          wordsClass: "word-js",
          linesClass: "line-js",
        });

        gsap.from(subcopySplit.words, {
          yPercent: 100,
          opacity: 0,
          duration: 1,
          stagger: 0.04,
          ease: "expo.out",
          delay: 0.7,
        });

        gsap.from(".hero-actions .custom-btn", {
          y: 40,
          opacity: 0,
          duration: 0.9,
          stagger: 0.12,
          ease: "expo.out",
          delay: 0.9,
        });
      };

      void waitForAppFonts().then(() => {
        if (cancelled) return;
        runAnimations();
      });

      return () => {
        cancelled = true;
        headlineSplit?.revert();
        subcopySplit?.revert();
      };
    },
    { scope: heroRef, dependencies: [heroReady] },
  );

  return (
    <section id="hero" ref={heroRef} className="hero-section">
      <div className="hero-footer">
        <div className="hero-intro">
          <h1 className="hero-headline">
            Presence that <span className="hero-headline__works">works</span>
          </h1>
          <p className="hero-subcopy">
            I build website that engage the user, sparks curiosity and keep
            visitors engaged
          </p>
        </div>

        <div className="hero-actions">
          <CustomButton
            label="Call now!"
            href={`tel:+1${PHONE}`}
            variant="primary"
            className="hero-cta--desktop"
          />
          <CustomButton
            label="Contact"
            to="/#contact"
            variant="primary"
            className="hero-cta--mobile"
          />
          <CustomButton
            label="Work"
            to="/#projects"
            variant="secondary"
          />
        </div>
      </div>
    </section>
  );
}
