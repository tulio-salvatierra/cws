import { useRef } from "react";
import { Link } from "react-router-dom";
import { PHONE } from "../../Constants/Constants";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { SplitText } from "gsap/SplitText";
import "./Hero.css";

gsap.registerPlugin(SplitText);

export default function Hero() {
  const heroRef = useRef<HTMLElement | null>(null);

  useGSAP(
    () => {
      const h1 = new SplitText(".hero-headline", {
        type: "chars, words",
        charsClass: "char-js",
        wordsClass: "word-js",
      });

      gsap.from(h1.chars, {
        yPercent: 110,
        opacity: 0,
        duration: 1.2,
        stagger: 0.02,
        ease: "expo.out",
        delay: 0.4,
      });

      const pwords = new SplitText(".hero-subcopy", {
        type: "words, lines",
        wordsClass: "word-js",
        linesClass: "line-js",
      });

      gsap.from(pwords.words, {
        yPercent: 100,
        opacity: 0,
        duration: 1,
        stagger: 0.04,
        ease: "expo.out",
        delay: 0.7,
      });

      gsap.from(".hero-cta", {
        y: 40,
        opacity: 0,
        duration: 0.9,
        stagger: 0.12,
        ease: "expo.out",
        delay: 0.9,
      });

      return () => {
        h1.revert();
        pwords.revert();
      };
    },
    { scope: heroRef },
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
