import { useRef } from "react";
import { CALENDLY_URL } from "./../../Constants/Constants";
import CustomButton from "./../CustomButton";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { SplitText } from "gsap/SplitText";
import "./Hero.css";
gsap.registerPlugin(SplitText);


export default function Hero() {
  const heroRef = useRef<HTMLDivElement | null>(null);
  const heroAnimRef = useRef<HTMLDivElement | null>(null);
  

  useGSAP(
    () => {
      const h1 = new SplitText(".h1", {
        type: "chars, words",
        charsClass: "char-js",
        wordsClass: "word-js",
        linesClass: "word-js",
      });
      const chars1 = h1.chars;
      gsap.from(chars1, {
        yPercent: 100,
        opacity: 0,
        duration: 5,
        stagger: 0.03,
        ease: "expo.out",
      });

      const pwords = new SplitText(".p", {
        type: "words, lines",
        wordsClass: "word-js",
        linesClass: "line-js",
      });
      const words = pwords.words;
      const lines = pwords.lines;
      gsap.from([words, lines], {
        yPercent: 100,
        xPercent: -80,
        rotateY: 90,
        opacity: 0,
          duration: 5,
          stagger: 0.06,
          ease: "expo.out",
        },
      );

      gsap.from(".heroScale", {
        scale: 1.8,
        opacity: 0,
        delay: 1,
        duration: 1,
        ease: "expo.out",
      });

      return () => {
        h1.revert();
        pwords.revert();
      };
    },
    { scope: heroRef },
  );

  return (
    <section 
      id="hero"
      ref={heroRef}
      className="relative z-10 w-[90vw] mx-auto h-screen overflow-hidden grid items-center"
    >
      {/* Foreground content: on top of the scene */}
      <div
        ref={heroAnimRef}
        className="relative z-20 p-1 w-full sm:min-h-screen items-end justify-center text-center p-1 grid grid-cols-1 md:grid-cols-2 gap-1 heroScale"
      >
        
        <div
          className="w-full h-full flex flex-col justify-end items-start"
        >
        <span className="text-black font-main font-light text-sm text-left mb-6 leading-tight text-center sm:text-left">
          [CICERO WEB STUDIO]
        </span>
          <h1 className="h1 fromBelow text-5xl md:text-8xl font-main font-semibold text-orange-300 text-left mb-6 leading-none tracking-tight text-center sm:text-left">
            Don't let the daily google traffic search miss your business
          </h1>
          <p
            className="p text-zinc-900 text-2xl md:text-3xl text-left font-main leading-none w-full mb-8"
          >
            By building a website that is optimized for search engines, you can
            increase your visibility and attract more customers by buidling trust!
          </p>
          <span className="text-black font-main font-light text-sm text-left mb-6 leading-tight text-center sm:text-left">[HABLAMOS ESPAÑOL]</span>
        </div>

        <div
          className="hero-anim grid grid-cols-2 items-start gap-4 justify-top items-top p-2"
        >
          <CustomButton
            href={CALENDLY_URL}
            label="Book Site Audit →"
            newTab={true}
          />
          <CustomButton href="#projects" label="Recent Work" secondary={true} />
        </div>
      </div>
    </section>
  );
}
