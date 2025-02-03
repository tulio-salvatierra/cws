// Code: Hero components
import Video from "./../../assets/video/hero.mp4";
import { PHONE } from "./../../Constants/Constants";

export default function Hero() {
  return (
    <>
      <main
        className="sm:grid w-screen h-screen justify-items-center bg-hero bg-cover bg-center grid-cols-2 gap-0 p-0"
        style={{
          backgroundSize: "50%",
          backgroundPosition: "right",
          backgroundRepeat: "no-repeat",
        }}
      >
        <video
          className="absolute top-0 left-0 w-full h-full object-cover aspect-video"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src={Video} type="video/mp4" />
        </video>
        <div className="absolute top-0 left-0 w-full h-full bg-black opacity-40"></div>

        <div className="relative flex flex-col sm:justify-evenly justify-end items-center p-10">
          <p className="font-secondary font-black sm:text-[6rem] text-[3rem] text-orange-700 sm:text-[6  rem] w-100 leading-tight">
            We don’t just build websites, we build growth
          </p>

          <h1 className="font-semibold sm:text-3xl text-lg text-white">
            Based in Chicago, we specialize in creating websites and software
            solutions tailored to help small businesses thrive.
          </h1>
          <a
            href={`tel:${PHONE}`}
            className="bg-orange-700 w-full border-solid text-white rounded-full block font-bold text-xl p-6 text-center"
          >
            Get my site started now!
          </a>
        </div>
      </main>
    </>
  );
}
