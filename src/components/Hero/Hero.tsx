import Video from "./../../assets/video/hero.mp4";
import { CALENDLY_URL, PHONE } from "./../../Constants/Constants";
import CustomButton from "./../CustomButton";

export default function Hero() {
  return (
    <section className="relative h-screen flex items-center justify-center text-center overflow-hidden -my-60 md:-my-60">
      {/* Background video */}
      <video
        className="absolute inset-0 w-full h-screen object-cover z-10"
        autoPlay
        loop
        muted
        playsInline
      >
        <source src={Video} type="video/mp4" />
      </video>

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black opacity-50 z-10"></div>

      {/* Content */}
      <div className="relative z-10 w-full h-full flex flex-col">
        {/* Top bar with logo and nav */}
      

        {/* Bottom content grid */}
        <div className="mt-auto grid grid-cols-1 md:grid-cols-2 p-6 gap-4">
          <p className="text-white sm:w-1/2 w-full text-left text-sm md:text-lg leading-tight">
            Cicero Web Studio is a digital agency specializing in web design,
            development, and digital marketing solutions. We create stunning,
            user-friendly websites that drive results and elevate your brand
            presence online.
          </p>
          <div className="flex flex-col md:flex-row gap-4 md:justify-end md:items-end">
            <CustomButton href="#" label="WORKS" />
            <CustomButton href={CALENDLY_URL} label="BOOK MY CONSULTATION" />
          </div>
        </div>
      </div>
    </section>
  );
}