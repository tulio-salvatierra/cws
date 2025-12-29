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
    <section className="relative w-full h-screen overflow-hidden">
      {/* Background scene */}
      <UnicornScene
        projectId="HVejgNImevGuTqdsIEo9"
        width="100%"
        height="100%"
        className="absolute top-0 left-0 w-full h-full object-cover -z-10"
        lazyLoad
        production={true}
      />

      {/* Foreground content */}
      <div
        ref={heroRef}
        className="relative hero-bg z-10 w-screen flex-col items-center justify-center text-center bottom-0 sm:mt-[-150px] mt-[-310px] grid grid-cols-1 md:grid-cols-2 gap-1"
      >
        <div className="hero-anim">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-main font-black text-white mb-6 leading-tight">
            Custom Web Design for Chicago Small Businesses
          </h1>
          <MaskedLines
            as="p"
            once={true}
            scrollStart="false"
            className="p-2 text-zinc-400 text-lg text-left font-light sm:w-1/2 w-full"
          >
            Creative Web, Photo, Video to make incredible experience, your best
            partner in taking your business to the next level. Take the lead,
            with unique and creative ideas that will build trust for your business and deliver growth
          </MaskedLines>
        </div>

        <div className="hero-anim flex flex-col md:flex-row gap-4 md:justify-end md:items-end p-2">
          <CustomButton href="#" label="WORKS" />
          <CustomButton href={CALENDLY_URL} label="BOOK MY CONSULTATION" />
        </div>
      </div>
    </section>
  );
}