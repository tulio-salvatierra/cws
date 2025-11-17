import { useRef } from "react";
import { useFadeInAnimation } from "../../Hooks/useFadeInAnimation";
import CustomButton from "../CustomButton";
import Logo from "/images/profile.png";


export default function Problem() {
  const fadeRefs = useRef<HTMLElement[]>([]);

  const addToRefs = (el: HTMLElement | null) => {
    if (el && !fadeRefs.current.includes(el)) {
      fadeRefs.current.push(el);
    }
  };

  useFadeInAnimation(fadeRefs);

  return (
    <section
      className="p-5 sm:h-screen h-auto flex flex-col w-full justify-evenly mt-80 overflow-x-hidden pin"
    >
      <div className="flex flex-col mb-10">
        <strong ref={addToRefs} className="text-white text-left">
          [INTRODUCING]
        </strong>
        <h2
          ref={addToRefs}
          className="font-main text-left font-semibold text-orange-500 sm:text-[6rem] text-[3rem] w-100 leading-tight"
        >
          CICERO WEB STUDIO
        </h2>
      </div>

      <div className="flex justify-center items-start h-auto w-full mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 sm:[grid-template-rows:1fr] mb-28 gap-28 h-auto w-full">
          <p
            ref={addToRefs}
            className="font-secondary text-white text-lg text-start paragraph"
          >
            We're your digital growth partners. Based in Chicago, we combine
            beautiful design with dedication to deliver solutions that move the
            needle for your business.
          </p>

          <div>
            <div className="flex flex-col text-start w-full text-white paragraph">
              <h2
                ref={addToRefs}
                className="font-secondary font-medium sm:text-6xl text-5xl text-zinc-400 w-full leading-tight mb-4"
              >
                What makes us different?
              </h2>
              <p
                ref={addToRefs}
                className="font-secondary text-lg text-white flex-1 paragraph"
              >
                Partnership approach: <br /> Your wins are our wins.
                Problem-solving mindset with a can-do attitude. Elegant design
                meets relentless execution. We go the extra mile, every single
                time.
              </p>
            </div>

            <div
              ref={addToRefs}
              className="flex flex-col sm:flex-row gap-4 mt-8"
            >
              <CustomButton href="/contact" label="Let's talk" />
              <CustomButton href="/works" label="See our works" />
            </div>
          </div>
        </div>
      </div>

      <img
        src={Logo}
        alt="Logo"
        ref={addToRefs}
        className="w-full h-full object-cover rounded-lg justify-self-center self-center -mt-20 sm:-mt-32"
      />
    </section>
  );
}