// Code: Hero components
import Video from "./../../assets/video/hero.mp4";
import { PHONE } from "./../../Constants/Constants";

export default function Hero() {
  return (
    <>
      <section
        className="sm:flex w-screen h-100 justify-items-center bg-hero bg-cover overflow-hidden bg-center grid-cols-2 gap-0 p-0"
        style={{
          backgroundSize: "100%",
          backgroundPosition: "right",
          backgroundRepeat: "no-repeat",
        }}
      >
        <video
          className="absolute top-0 left-0 w-full h-screen object-cover "
          autoPlay
          loop
          muted
          playsInline
        >
          <source src={Video} type="video/mp4" />
        </video>
        <div className="absolute top-0 left-0 w-full h-auto bg-black opacity-10"></div>

        <div className="relative flex-1 h-100 p-4 w-100 items-between">
          <p className="font-main leading-none font-normal text-[4rem] text-orange-500 w-100 leading-tighter">
            We don’t just build websites... 
          </p><p className="text-[5rem] P-4 font-main font-bold leading-tighter text-orange-200 outline-4-white">WE BUILD GROWTH</p>

         
        </div>
        <div className="hidden sm:block w-1/2 h-screen bg-hero bg-cover bg-center"> <h1 className="font-semibold font-secondary sm:text-3xl text-2xl text-white my-8">
            Based in Chicago, we specialize in creating websites and software
            solutions tailored to help small businesses thrive.
          </h1>
          <a
            href={`tel:${PHONE}`}
            className="bg-orange-500 max-w-fit border-solid text-white rounded-full block font-bold text-xl p-6 text-center"
          >
            Get my site started now!
          </a></div>
      </section>
    </>
  );
}
