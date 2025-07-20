import Video from "./../../assets/video/hero.mp4";
import { PHONE } from "./../../Constants/Constants";

export default function Hero() {
  return (
    <section className="relative h-screen flex items-center justify-center text-center overflow-hidden">
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
      <div className="relative z-10 container px-4 md:px-6">
        <div className="mx-auto max-w-4xl text-center text-white">
          <span className="mb-4 inline-block bg-orange-100 text-stone-500 px-4 py-2 rounded hover:bg-blue-200">
            🆓 Get your free strategy session
          </span>
          <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
            Transform Your Business <span className="text-orange-600">Optimize your Growth</span>
          </h1>
          <p className="mb-8 text-lg md:text-xl lg:text-2xl max-w-3xl mx-auto">
         Chicago's premier web design studio creating elegant, powerful solution for local businesses and beyond 🚀
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg px-8 py-4 rounded"
              href="#"
            >
              Learn More
            </a>
            <a
              href={`tel:${PHONE}`}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg px-8 py-4 rounded"
            >
              Schedule a Session
            </a>
          </div>
   
        </div>
      </div>
    </section>
  );
}