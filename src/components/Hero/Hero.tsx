// Code: Hero components
import Video from "./../../assets/video/hero.mp4";
import { PHONE } from "./../../Constants/Constants";

export default function Hero() {
  return (
    <>
      <section
        className="sm:flex w-screen h-fit justify-items-center bg-hero bg-cover overflow-hidden bg-center grid-cols-2 gap-0 p-0"
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

        <div className="relative h-screen flex flex-col justify-center items-center p-4 w-100 sm:w-3/4">
          <p className="font-main leading-none font-black text-[4rem] text-orange-500 sm:text-[6rem] w-100 leading-tighter">
            We don’t just build websites, we build growth
          </p>

          <h1 className="font-semibold font-secondary sm:text-3xl text-2xl text-white my-8">
            Based in Chicago, we specialize in creating websites and software
            solutions tailored to help small businesses thrive.
          </h1>
          <a
            href={`tel:${PHONE}`}
            className="bg-orange-500 w-full border-solid text-white rounded-full block font-bold text-xl p-6 text-center"
          >
            Get my site started now!
          </a>
        </div>
      </section>
    </>
  );
}
