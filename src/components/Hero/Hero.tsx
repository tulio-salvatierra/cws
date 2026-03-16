import React, { useRef } from "react";
import { CALENDLY_URL } from "./../../Constants/Constants";
import CustomButton from "./../CustomButton";
import MaskedLines, { MaskedWords } from "./../MaskedLines/MaskedLines";
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
    <section
      id="hero"
      className="relative z-10 w-full h-screen overflow-hidden grid items-center" 
    >
 

      {/* Foreground content: on top of the scene */}
      <div
        ref={heroRef}
        className="relative z-20 p-1 w-full min-h-screen items-end justify-center text-center p-1 grid grid-cols-1 md:grid-cols-2 gap-1"
      >
        <div className="w-full h-full flex flex-col justify-end items-start">
          <h1 className="text-5xl md:text-5xl lg:text-5xl font-main font-black text-white text-left mb-6 leading-tight text-center sm:text-left">
            Chicago Websites That Actually Bring in Customers
          </h1>
          <MaskedLines
            as="p"
            once={true}
            className="text-zinc-900 text-xl md:text-xl text-left font-main leading-relaxed w-full mb-8"
          >
            Giving small businesses a competitive edge in Chicago, combining modern web design with practical marketing strategies and a partnership approach to help your business GROW!
          </MaskedLines>
        </div>

        <div className="hero-anim flex flex-col md:flex-row gap-4 md:justify-end md:items-end p-2">
          <CustomButton href={CALENDLY_URL} label="Book Free 15-Min Site Audit →" newTab={true} />
          <CustomButton href="#projects" label="See Recent Work ↓" secondary={true} />
        </div>
      </div>
    </section>
  );
}