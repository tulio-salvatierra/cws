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
            className="font-secondary text-zinc-400 text-lg sm:text-md text-start w--50 sm:w-3/4"
          >
            Our mission is to deliver tailored websites and software solutions
            that solve real problems and drive meaningful growth. We offer a
            wide range of services to help you achieve your goals.
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
