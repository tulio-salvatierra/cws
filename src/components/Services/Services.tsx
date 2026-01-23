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
      <section className="flex flex-col w-full h-auto justify-evenly px-5 py-8 overflow-x-hidden">
        <strong className="text-white">[WHAT WE DO]</strong>
        
        <h2 ref={scrambleRef} className="font-main font-semibold sm:text-[6rem] text-lg text-orange-500 w-100 leading-tight">
          <TileMask text="Services" />
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-10">
          <MaskedLines
            as="p"
            scroll
            scrollStart="top 85%"
            className="font-secondary text-zinc-300 text-lg md:text-xl sm:text-md text-start w--50 sm:w-3/4 leading-relaxed"
          >
            We build Chicago websites that actually bring in customers. No fluff, just results: more bookings, calls, and sales. From <a href="/landing/cicero-web-design" className="text-orange-500 hover:text-orange-400 underline">Cicero web design</a> to <a href="/landing/chicago-digital-marketing" className="text-orange-500 hover:text-orange-400 underline">Chicago digital marketing</a> and <a href="/landing/oak-park-seo" className="text-orange-500 hover:text-orange-400 underline">Oak Park SEO services</a>, we help small businesses in Humboldt Park, Portage Park & greater Chicago succeed online.
          </MaskedLines>
        </div>
        <ul className="flex flex-col">
          <li className="py-2">
            <ServicesCard />
          </li>
        </ul>
      </section>
    </>
  );
}
