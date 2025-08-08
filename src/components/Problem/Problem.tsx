import { Banner } from "../Banner";
import CustomButton from "../CustomButton";

export default function Problem() {
  return (
    <>
      <section className="p-5  flex flex-col w-screen h-50 justify-evenly mt-80">
        <div className="flex flex-col mb-10">
          <strong className="text-orange-500 text-left">[PROJECTS]</strong>
          <h2 className="font-main text-left font-black sm:text-[6rem] text-[3rem] text-zinc-700 sm:text-[6  rem] w-100 leading-tight">
            What we do
          </h2>
        </div>
        <div className="flex flex-col justify-center items-start text-white w-full">
          <Banner />
          <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-rows-2 gap-6 sm:gap-8">
            <p className="font-main text-orange-500 text-2xl font-bold text-start">
              We're your digital growth partners. Based in Chicago, we combine
              beautiful design with heavy metal determination to deliver
              solutions that actually move the needle for your business
            </p>

            <div>
              <div className="flex flex-col text-start w-full text-white">
                <h2 className="font-main font-black sm:text-4xl text-6xl text-zinc-700 w-full leading-tight mb-4">
                  What makes us different?
                </h2>
                <p className="font-secondary text-lg sm:text-xl text-white flex-1">
                  Partnership approach: Your wins are our wins. Problem-solving
                  mindset with a can-do attitude. Elegant design meets
                  relentless execution. We go the extra mile, every single time.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 mt-8">
                  <CustomButton href="/contact" label="Let's talk" />
                  <CustomButton href="/works" label="See our works" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
