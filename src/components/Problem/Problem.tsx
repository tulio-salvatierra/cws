import { Banner } from "../Banner";
import CustomButton from "../CustomButton";
import Logo from "/images/profile.png";

export default function Problem() {
  return (
    <>
      <section className="p-5 flex flex-col w-full h-50 justify-evenly mt-80 overflow-x-hidden">
        <div className="flex flex-col mb-10">
          <strong className="text-white text-left">[INTRODUCING]</strong>
          <h2 className="font-main text-left font-black sm:text-[6rem] text-[3rem] text-orange-500 sm:text-[6rem] w-100 leading-tight">
            CICERO WEB STUDIO
          </h2>
        </div>
        <div className="flex flex-col justify-center items-start h-auto w-full">

          <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-rows-2 gap-6 sm:gap-8 h-auto">
            <p className="font-secondary text-white text-lg text-start">
              We're your digital growth partners. Based in Chicago, we combine
              beautiful design with dedication to deliver
              solutions that move the needle for your business
            </p>

            <div>
              <div className="flex flex-col text-start w-full text-white">
                <h2 className="font-secondary font-medium sm:text-6xl text-5xl text-zinc-400 w-full leading-tight mb-4">
                  What makes us different?
                </h2>
                <p className="font-secondary text-lg text-white flex-1">
                  Partnership approach: <br /> Your wins are our wins. Problem-solving
                  mindset with a can-do attitude. Elegant design meets
                  relentless execution. We go the extra mile, every single time.
                </p>

              </div>
              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <CustomButton href="/contact" label="Let's talk" />
                <CustomButton href="/works" label="See our works" />
              </div>
            </div>
            <img src={Logo} alt="Logo" className="w-full h-full object-cover rounded-lg" />
          </div>
        </div>
      </section>
    </>
  );
}
