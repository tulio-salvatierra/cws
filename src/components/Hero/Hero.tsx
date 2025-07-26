import Video from "./../../assets/video/hero.mp4";
import { PHONE } from "./../../Constants/Constants";
import CustomButton from "./../CustomButton";

export default function Hero() {
  return (
    <section className="relative h-screen flex items-center justify-center text-center overflow-hidden -my-60 md:-my-60">
      {/* Background video */}
      <video
        className="absolute inset-0 w-full h-full object-cover z-0"
        autoPlay
        loop
        muted
        playsInline
      >
        <source src={Video} type="video/mp4" />
      </video>

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black opacity-50 z-0"></div>

      {/* Content */}
      <div className="relative z-10 w-full h-full flex flex-col">
        {/* Top bar with logo and nav */}
      

        {/* Bottom content row */}
        <div className="mt-auto flex justify-between items-end p-6 gap-4 flex-wrap">
          <p className="text-white text-left text-lg md:text-lg max-w-3xl leading-relaxed">
            Cicero Web Studio is a digital agency specializing in web design,
            development, and digital marketing solutions. We create stunning,
            user-friendly websites that drive results and elevate your brand
            presence online.
          </p>
          <div className="flex gap-4">
            <CustomButton href="#" label="WORKS" />
            <CustomButton href={`tel:${PHONE}`} label="CONTACT" />
          </div>
        </div>
      </div>
    </section>
  );
}