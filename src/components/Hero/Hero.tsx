import { useRef } from "react";
import { CALENDLY_URL } from "./../../Constants/Constants";
import CustomButton from "./../CustomButton";
import MaskedLines from "./../MaskedLines/MaskedLines";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export default function Hero() {
  const heroRef = useRef<HTMLDivElement | null>(null);
  const heroAnimRef = useRef<HTMLDivElement | null>(null);
  useGSAP(
    () => {
      // h1 animation
      gsap.from('fromBelow', {
        opacity: 0,
        y: 10,
        duration: 1,
        stagger: 0.22,
        ease: "power2.out",
      });
      // p animation
      gsap.from('p', {
        opacity: 0,
        y: 10,
        duration: 1,
        stagger: 0.22,
        ease: "power2.out",
      });
  
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
        className="relative z-20 p-1 w-full sm:min-h-screen items-end justify-center text-center p-1 grid grid-cols-1 md:grid-cols-2 gap-1 hero-anim"
      >
        
        <div className="w-full h-full flex flex-col justify-end items-start">
        <span className="text-black font-main font-light text-sm text-left mb-6 leading-tight text-center sm:text-left">
          [CICERO WEB STUDIO]
        </span>
          <h1 className="fromBelow text-5xl md:text-5xl font-main font-semibold text-orange-300 text-left mb-6 leading-none tracking-tight text-center sm:text-left">
            Don't the daily traffic search miss your business
          </h1>
          <p
            className="text-zinc-900 text-xl md:text-xl text-left font-main leading-none w-full mb-8"
          >
            By building a website that is optimized for search engines, you can
            increase your visibility and attract more customers.
          </p>
          <span className="text-black font-main font-light text-sm text-left mb-6 leading-tight text-center sm:text-left">[HABLAMOS ESPAÑOL]</span>
        </div>

        <div className="hero-anim grid grid-cols-2 items-start gap-4 justify-top items-top p-2">
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
