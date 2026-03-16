import { useState, useEffect } from "react";
import { MeshGradient } from "@paper-design/shaders-react";
import ServicesCard from "../ServicesCard";
import TileMask from "../TileMask/TileMask";
import { useScramble } from "../../Hooks/useScramble";
import { useFadeIn } from "../../Hooks/useFadeIn";
import MaskedLines from "../MaskedLines/MaskedLines";

export default function Services() {
  const scrambleRef = useScramble("SERVICES", 0.1);
  const fadeInRef = useFadeIn();

  return (
    <>
      <section
        id="services"
        className="relative flex flex-col w-full h-auto justify-evenly overflow-x-hidden bg-orange-500 z-10"
      >
        {/* Mesh gradient: full section bg, revealed when card white slides on hover */}

        <div className="relative z-10">
          {/* White block: header + intro only; cards area has gradient behind */}
          <div className="bg-[#f97316] px-5 py-6 z-10">
            <strong className="text-white">[WHAT WE DO]</strong>
            <h2
              ref={scrambleRef}
              className="font-main font-semibold sm:text-[6rem] text-6xl text-black w-100 leading-tight"
            >
              <TileMask text="Services" />
            </h2>
            <MaskedLines
              as="p"
              scroll
              scrollStart="top 85%"
              className="font-main text-zinc-900 text-2xl sm:text-3xl w-full text-start leading-relaxed"
            >
              We build Chicago websites that actually bring in customers. No
              fluff, just results: more bookings, calls, and sales. From Cicero
              web design and Chicago digital marketing to Oak Park SEO services,
              we help small businesses in Humboldt Park, Portage Park & greater
              Chicago succeed online.
            </MaskedLines>
          </div>
          <ul className="flex flex-col">
            <li className="relative">
              <div className="absolute inset-0 z-0 overflow-hidden bottom-0 h-full">
                <MeshGradient
                  width={1280}
                  height={2000}
                  colors={[
                    "#000000",
                    "#bda8a8",
                    "#cc7528",
                    "#000000",
                    "#000000",
                    "#000000",
                  ]}
                  distortion={1}
                  swirl={0}
                  grainMixer={1}
                  grainOverlay={0.08}
                  speed={0.16}
                  scale={1.12}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              <div className="relative z-10">
                <ServicesCard />
              </div>
            </li>
          </ul>
        </div>
      </section>
    </>
  );
}
