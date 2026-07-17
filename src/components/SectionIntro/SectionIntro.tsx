import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { SplitText } from "gsap/SplitText";
import ScrollTrigger from "gsap/ScrollTrigger";
import "./SectionIntro.css";

gsap.registerPlugin(SplitText, ScrollTrigger, useGSAP);

type SectionIntroProps = {
  title: string;
  id?: string;
};

export default function SectionIntro({ title, id }: SectionIntroProps) {
  const sectionRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const root = sectionRef.current;
      if (!root) return;

      const heading = root.querySelector(".section-intro__title");
      if (!heading) return;

      const split = new SplitText(heading, {
        type: "chars",
        charsClass: "section-intro__char_js",
      });

      gsap.from(split.chars, {
        scrollTrigger: {
          trigger: root,
          start: "top 50%",
          end: "bottom 50%",
        },
        duration: 1.8,
        opacity: 0,
        ease: "expo.out",
        stagger: 0.06,
      });
    },
    { scope: sectionRef, dependencies: [title] },
  );

  return (
    <div ref={sectionRef} className="section-intro" id={id}>
      <h2 className="section-intro__title">{title}</h2>
    </div>
  );
}
