// Code: Hero components
import Video from "./../../assets/video/hero.mp4";
import { PHONE } from "./../../Constants/Constants";

export default function Hero() {
  return (
    <>
      <div
        className="sm:flex w-screen h-screen bg-hero bg-cover bg-center gap-0 p-0 absolute"
        style={{
          backgroundSize: "100%",
          backgroundPosition: "right",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Background video */}
        <video
          className="absolute top-0 left-0 w-screen h-dvh object-cover "
          autoPlay
          loop
          muted
          playsInline
        >
          <source src={Video} type="video/mp4" />
        </video>
        {/* overlay */}
        <div className=" relative m-4 top-0 left-0 w-full h-100 bg-black opacity-10"></div>

        <div className="flex flex-col relative p-4 h-100">
          <div className="top-0">
            <p className="font-main leading-none font-normal text-[4rem] text-orange-500 w-100 leading-tighter">
              We don’t just build websites...
            </p>
            <p className="text-[5rem] leading-tight P-4 font-main font-bold leading-tighter text-orange-200 outline-4-white">
              WE BUILD GROWTH
            </p>
          </div>
          <div className="bottom-0">
            <h1 className="font-normal font-secondary w-50 text-zinc-700 my-8">
              Based in Chicago, we specialize in creating websites and software
              solutions tailored to help small businesses thrive.
            </h1>
            <a
              href={`tel:${PHONE}`}
              className="bg-orange-500 max-w-fit border-solid text-white rounded-full block font-bold text-xl p-6 text-center"
            >
              Get my site started now!
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
