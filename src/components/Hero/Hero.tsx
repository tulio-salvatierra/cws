import { useRef } from "react";
import { Link } from "react-router-dom";
import { PHONE } from "../../Constants/Constants";
import { useLoaderReady } from "../../context/LoaderContext";
import { waitForAppFonts } from "../../lib/waitForAppFonts";

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
      const tweens: gsap.core.Tween[] = [];

      const runAnimations = () => {
        if (cancelled || !heroRef.current) return;

        headlineSplit = new SplitText(".hero-headline", {
          type: "chars, words",
          charsClass: "char-js",
          wordsClass: "word-js",
        });

        tweens.push(
          gsap.from(headlineSplit.chars, {
            yPercent: 110,
            opacity: 0,
            duration: 1.2,
            stagger: 0.02,
            ease: "expo.out",
            delay: 0.4,
          }),
        );

        subcopySplit = new SplitText(".hero-subcopy", {
          type: "words, lines",
          wordsClass: "word-js",
          linesClass: "line-js",
        });

        tweens.push(
          gsap.from(subcopySplit.words, {
            yPercent: 100,
            opacity: 0,
            duration: 1,
            stagger: 0.04,
            ease: "expo.out",
            delay: 0.7,
          }),
        );

        const ctas = gsap.utils.toArray<HTMLElement>(
          heroRef.current.querySelectorAll(".hero-cta"),
        );

        tweens.push(
          gsap.fromTo(
            ctas,
            { y: 40, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.9,
              stagger: 0.12,
              ease: "expo.out",
              delay: 0.9,
              clearProps: "transform",
            },
          ),
        );
      };

      void waitForAppFonts().then(() => {
        if (cancelled) return;
        runAnimations();
      });

      return () => {
        cancelled = true;
        tweens.forEach((tween) => tween.kill());
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
            Presence that <span className="hero-headline__works">WORKS!</span>
          </h1>
          <p className="hero-subcopy">
            I build websites that engage users, sparks curiosity and keep
            visitors engaged so your business can grow.
          </p>
        </div>

        <div className="hero-actions">
          <a
            href={`tel:+1${PHONE}`}
            className="hero-cta hero-cta--primary hero-cta--desktop"
          >
            Call now!
          </a>
          <Link
            to="/#contact"
            className="hero-cta hero-cta--primary hero-cta--mobile"
          >
            Contact
          </Link>
          <Link to="/#projects" className="hero-cta hero-cta--secondary">
            Work
          </Link>
        </div>
      </div>
    </section>
  );
}
