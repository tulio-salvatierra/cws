import React, { useRef } from "react";
import Video from "./../../assets/video/hero.mp4";
import { CALENDLY_URL, PHONE } from "./../../Constants/Constants";
import CustomButton from "./../CustomButton";
import MaskedLines, { MaskedWords } from "./../MaskedLines/MaskedLines";
import UnicornScene from "unicornstudio-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export default function Hero() {
  const heroRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      // Animamos los elementos marcados con la clase .hero-anim
      gsap.from(".hero-anim", {
        opacity: 0,
        y: 30,
        duration: 1,
        stagger: 0.15,
        ease: "power2.out",
      });
    },
    { scope: heroRef } // limitamos el selector al contenedor del hero
  );

  return (
    <section className="relative mt-[50px] w-full h-screen overflow-hidden">
      {/* Background scene */}
      <UnicornScene
        projectId="HVejgNImevGuTqdsIEo9"
        
        className="absolute top-0 left-0 w-full h-screen object-cover -z-10"
        lazyLoad
        production={true}
      />

      

      {/* Foreground content */}
      <div
        ref={heroRef}
        className="p-2 relative hero-bg z-10 w-screen flex-col items-center justify-center text-center bottom-0 sm:mt-[-470px] mt-[-500px] sm:p-2 p-1 grid grid-cols-1 md:grid-cols-2 gap-1"
      >
        <div className="hero-anim md:w-3/4 w-full">
          <h1 className="text-4xl md:text-5xl lg:text-5xl font-main font-black text-white text-left mb-6 leading-tight text-center sm:text-left">
            Chicago Websites That Actually Bring in Customers
          </h1>
          <MaskedLines
            as="p"
            once={true}
            scrollStart="false"
            className="text-zinc-300 text-xl md:text-xl text-left font-normal leading-relaxed sm:w-4/5 w-full mb-8"
          >
            I'm Tulio — ex-logistics pro turned web dev — building modern, fast sites for small businesses in Humboldt Park, Portage Park & greater Chicago. No fluff, just results: more bookings, calls, and sales.
          </MaskedLines>
        </div>

        <div className="hero-anim flex flex-col md:flex-row gap-4 md:justify-start md:items-start p-2">
          <CustomButton href={CALENDLY_URL} label="Book Free 15-Min Site Audit →" newTab={true} />
          <CustomButton href="#projects" label="See Recent Work ↓" secondary={true} />
        </div>
      </div>
    </section>
  );
}