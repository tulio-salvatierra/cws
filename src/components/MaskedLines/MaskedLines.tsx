/* eslint-disable no-unused-vars */
import React, { useRef } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import  ScrollTrigger  from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { JSX } from "react/jsx-runtime";

gsap.registerPlugin(SplitText, ScrollTrigger, useGSAP);

interface MaskedTextProps {
  children: React.ReactNode;
  as?: React.ElementType;
  scroll?: boolean;
  scrollStart?: string;
  once?: boolean;
  variant?: "lines" | "words";
  className?: string;
}

function MaskedText({
  children,
  as: Component = "p",
  scroll = false,
  scrollStart = "top 80%",
  once = false,
  variant = "lines", // "lines" | "words"
  className = "",
}: MaskedTextProps) {
  const textRef = useRef(null);

  useGSAP(
    () => {
      const el = textRef.current;
      if (!el) return;

      // ensure base node is visible
      gsap.set(el, { opacity: 1 });

      const isWords = variant === "words";

      const splitInstance = SplitText.create(el, {
        ...(isWords
          ? {
              type: "words",
              mask: "words",
            }
          : {
              type: "words,lines",
              linesClass: "line",
              mask: "lines",
            }),
        autoSplit: true,
        // 🔑 this runs every time SplitText resplits (fonts, resize, etc.)
        onSplit: (split) => {
          const targets = isWords ? split.words : split.lines;
          if (!targets || !targets.length) return;

          const animationConfig = {
            duration: isWords ? 1.1 : 1.6,
            yPercent: 120,
            opacity: 0,
            stagger: isWords ? 0.06 : 0.28,
            ease: "power3.out",
            delay: isWords ? 0.1 : 0.15,
          };

          if (scroll) {
            (animationConfig as any).scrollTrigger = {
              trigger: el,
              start: scrollStart,
              toggleActions: once
                ? "play none none none"
                : "play none none reset",
            };
          }

          // this tween always gets the *current* nodes
          gsap.from(targets, animationConfig);
        },
      });

      // useGSAP will automatically revert splitInstance + kill tweens
      return () => {
        splitInstance.revert();
      };
    },
    {
      // if any of these change, the context re-runs cleanly
      dependencies: [scroll, scrollStart, once, variant, children],
      scope: textRef,
    }
  );

  return (
    <div className="container-text-masked-lines">
      {React.createElement(
        Component,
        { ref: textRef, className: `split ${className}` },
        children
      )}
    </div>
  );
}

// default: lines
export default function MaskedLines(props: Omit<MaskedTextProps, "variant">) {
  return <MaskedText {...props} variant="lines" />;
}

export function MaskedWords(props:Omit<MaskedTextProps, "variant">) {
  return <MaskedText {...props} variant="words" />;
}

export { MaskedText };