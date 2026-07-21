import { servicesData } from "./servicesCardData";
import { useFadeIn } from "../../Hooks/useFadeIn";
import { useEffect, useState } from "react";
import LottieAnimation from "./lotties/Lottie";
import CustomButton from "../CustomButton/CustomButton";

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
      
      {servicesData.map((data) => (
        <div
          key={data.id}
          className="group relative overflow-hidden grid grid-cols-1 sm:grid-cols-5 items-end mx-auto w-full border-2 border-black/50"
        >
          {/* White overlay: slides down on hover to reveal mesh gradient behind */}
          <div
            className="absolute inset-0 z-10 bg-orange-500 transition-transform duration-500 ease-out group-hover:translate-y-full"
            aria-hidden
          />
          <div className="col-span-12 grid sm:grid-cols-12 place-items-center items-start justify-evenly sm:justify-start relative z-20 p-4">
            <span ref={fadeInRef} className="col-span-1 text-white text-left font-light font-main text-5xl transition-colors duration-500 group-hover:text-white">
              {`[0${data.id}]`}
            </span>
            {data.image && (
              <div className="col-span-4 lottie-ctn" data-path={data.image}>
                <LottieAnimation path={data.image} />
              </div>
            )}
            
            <div className="col-span-12 sm:col-span-7  text-center grid items-center gap-4 items-start justify-center mx-auto">
            <h3 className="sm:col-span-7 col-span-12 text-left justify-center font-semi bold font-main text-4xl sm:text-8xl transition-colors duration-500 group-hover:text-white">{data.title}</h3>
            <p className="sm:col-span-12 col-span-12 text-left justify-center font-light font-main text-2xl w-3/4 transition-colors duration-500 group-hover:text-white">{data.description}</p>
              <div className="col-span-12 text-center justify-center">
                <CustomButton href={`tel:+17863146121`} label="Call Now" />
              </div>
            </div>
          </div>  
        </div>
      ))}
    </div>
  );
}
