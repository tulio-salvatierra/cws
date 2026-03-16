import { servicesData } from "./servicesCardData";
import { useFadeIn } from "../../Hooks/useFadeIn";
import MaskedLines from "../MaskedLines/MaskedLines";
import { MeshGradient } from "@paper-design/shaders-react";
import { useEffect, useState } from "react";
export default function ServicesCard() {
  const fadeInRef = useFadeIn();
  const [size, setSize] = useState({ width: 1920, height: 2580 });

  useEffect(() => {
    const updateSize = () =>
      setSize({ width: window.innerWidth, height: window.innerHeight });
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);
  return (
    <div ref={fadeInRef} className="flex flex-col mx-auto w-screen ">
      
      {servicesData.map((data: { id: React.Key | null | undefined; title: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined; description: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | null | undefined; image: string | undefined; }) => (
        <div
          key={data.id}
          className="group relative overflow-hidden grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 items-end mx-auto w-full min-h-[380px] border-2 border-black/50"
        >
          {/* White overlay: slides down on hover to reveal mesh gradient behind */}
          <div
            className="absolute inset-0 z-10 bg-orange-500 transition-transform duration-500 ease-out group-hover:translate-y-full"
            aria-hidden
          />
          <div className="col-span-1 grid place-items-center items-start justify-start relative z-20 p-4">
            <span ref={fadeInRef} className="text-orange-300 font-bold font-main text-5xl transition-colors duration-500 group-hover:text-white">
              {`[0${data.id}]`}
            </span>
            {data.image && (
              <img
                className="w-auto mx-auto h-[250px] max-w-xs sm:max-w-sm lg:max-w-md sm:ml-auto object-fit hover:rotate-180 transition-all duration-500"
                src={data.image}
                alt={typeof data.title === 'string' ? data.title : 'Service Image'}
              />
            )}
          </div>
          <div className="sm:col-span-1 lg:col-span-2 flex flex-col justify-start gap-6 h-full relative z-20 p-4">
            <h2 ref={fadeInRef} className="text-zinc-900 font-main text-6xl sm:text-6xl transition-colors duration-500 group-hover:text-white">
              {data.title}
            </h2>
            <MaskedLines
              as="p"
              scroll
              scrollStart="top 85%"
              className="font-main text-zinc-800 text-2xl w-100 transition-colors duration-500 group-hover:text-white"
            >
              {data.description}
            </MaskedLines>
          </div>
          
        </div>
      ))}
    </div>
  );
}
