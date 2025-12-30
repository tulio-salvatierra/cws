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
        <div className="hero-anim">
          <h1 className="text-4xl font-main font-black text-white text-left mb-6 leading-tight">
            Custom Web Design in Chicago for Small Businesses
          </h1>
          <MaskedLines
            as="p"
            once={true}
            scrollStart="false"
            className="text-zinc-400 text-lg text-left font-normal leading-5 sm:w-2/3 w-full"
          >
            Expert custom web design Chicago services for small businesses. Professional web design agency creating modern, conversion-focused websites. Chicago web design studio trusted by local businesses to enhance their online presence and drive growth. Explore our <a href="/services" className="text-orange-500 hover:text-orange-400 underline">professional web design services</a> or learn about <a href="/landing/cicero-web-design" className="text-orange-500 hover:text-orange-400 underline">affordable web design in Cicero</a>.
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