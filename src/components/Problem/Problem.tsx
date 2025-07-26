import CustomButton from "../CustomButton";

export default function Problem() {
  return (
    <>
      <section className="p-5 md:grid md:grid-cols-2 md:grid-rows-2 md:gap-y-44 gap-y-20 flex flex-col w-screen h-50 justify-evenly mt-72">
        <div>
          <h2 className="font-main font-black sm:text-[6rem] text-[3rem] overflow-visible text-zinc-400 w-100 leading-tight">
            We're not just another web design agency
          </h2>
          <p className="font-secondary text-orange-500 text-lg text-start">
            We're your digital groth partners. Based in Chicago, we combine
            beautiful design with heavy metal determination to deliver solutions
            that actually move the needle for your business
          </p>
        </div>
    <div></div>
        <div></div>
        <div className="flex flex-col text-start w-full text-white">
          <h2 className="font-main font-black sm:text-4xl text-2xl text-orange-900 w-full leading-tight mb-4">
            What makes us different?
          </h2>
          <p className="font-secondary text-lg sm:text-2xl text-slate-400 flex-1">
            Partnership approach: Your wins are our wins. Problem-solving mindset with a can-do attitude.
            Elegant design meets relentless execution. We go the extra mile, every single time.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <CustomButton href="/contact" label="Let's talk" />
          <CustomButton href="/works" label="See our works" />
          </div></div>
      </section>
    </>
  );
}
