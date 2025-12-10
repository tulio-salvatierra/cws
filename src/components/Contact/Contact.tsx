import {
  PINTEREST_URL,
  FACEBOOK_URL,
  INSTAGRAM_URL,
  YOUTUBE_URL,
  LINKEDIN_URL,
  TWITTER_URL,
  EMAIL,
  PHONE,
} from "../../Constants/Constants";
import { MeshGradient } from "@paper-design/shaders-react";
import { useEffect, useState } from "react";
import CustomButton from "../CustomButton/CustomButton";

export default function Contact() {
  const [dimensions, setDimensions] = useState({ width: 1920, height: 1080 });

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  return (
    <section className="relative mt-10 w-full min-h-screen flex flex-col items-center justify-center p-4 gap-8 overflow-hidden">
      {/* MeshGradient Background */}
      <div className="absolute inset-0 w-full h-screen z-0">
        <MeshGradient
          width={dimensions.width}
          height={dimensions.height}
          colors={["#8f9299", "#ff9900", "#000000", "#fa9600"]}
          distortion={0}
          swirl={0}
          grainMixer={1}
          grainOverlay={1}
          speed={1.52}
          scale={1.08}
          rotation={248}
          offsetX={-0.1}
        />
      </div>

      {/* Main content block */}
      <div className="relative z-10 text-white w-full rounded-2xl p-4 bg-zinc-800/01 backdrop-blur-xs">
        {/* Header with brand name */}
        <div className="text-center mb-12">
          <h2 className="text-6xl text-left md:text-8xl lg:text-9xl text-orange-500 font-main font-black mb-4">
            GET IN TOUCH
          </h2>
        </div>

        {/* Main content area with profile and contact info */}
        <div className="grid grid-cols-2 sm:grid-cols-3 flex-col lg:flex-row items-center lg:items-start gap-12 lg:gap-16">
          {/* Profile Picture Section */}
          <div className="flex-shrink-0 text-center lg:text-left">
            <div className="relative inline-block">
              <div className="flex justify-center items-end mx-auto shadow-2xl">
                <img
                  src="/images/tulio.png"
                  alt="Tulio Salvatierra"
                  className=" object-cover rounded-md"
                />
              </div>
              
            </div>
            <h3 className="text-xl md:text-2xl font-main font-bold text-white mt-6">
              Tulio Salvatierra
            </h3>
            <p className="text-zinc-100 text-sm md:text-base font-secondary">
              Founder & Developer
            </p>
            {/* Email address */}
            <div className="flex flex-col gap-4 items-start justify-start mt-4">
              <p className="text-left">
                I am available for call or emails. Let's talk about your
                project.
              </p>
              <div className="flex flex-row gap-4 items-center justify-start mt-4">
                <CustomButton label="Email Us" href={`mailto:${EMAIL}`} />
                <CustomButton label="Call Us" href={`tel:+1${PHONE}`} />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-4 items-center justify-center">
            <h3 className="text-lg text-left md:text-xl lg:text-2xl xl:text-3xl text-white hover:text-orange-400 transition-colors duration-200 block mb-2">
              [SOCIAL]
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-zinc-300">
              <div className="w-fit">
                <a
                  className="text-zinc-100 font-secondary font-semibold"
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  INSTAGRAM
                </a>
              </div>
              <div className="w-fit">
                <a
                  className="text-zinc-100 text-left font-secondary font-semibold"
                  href={YOUTUBE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  YOUTUBE
                </a>
              </div>
              <div className="w-fit">
                <a
                  className="text-zinc-100 font-secondary font-semibold"
                  href={FACEBOOK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  FACEBOOK
                </a>
              </div>
              <div className="w-fit">
                <a
                  className="text-zinc-100 font-secondary font-semibold"
                  href={TWITTER_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  TWITTER
                </a>
              </div>
              <div className="w-fit">
                <a
                  className="text-zinc-100 font-secondary font-semibold"
                  href={PINTEREST_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  PINTEREST
                </a>
              </div>
              <div className="w-fit">
                <a
                  className="text-zinc-100 font-secondary font-semibold"
                  href={LINKEDIN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  LINKEDIN
                </a>
              </div>
            </div>
            <div className="w-full mt-8 rounded-xl overflow-hidden">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d252.5880090363163!2d-87.7509307390869!3d41.95077474768748!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x880fcde85586be3d%3A0x88f84b57cb03f35b!2sCicero%20Web%20Studio!5e1!3m2!1sen!2sus!4v1761046047715!5m2!1sen!2sus"
            width="100%"
            height="auto"
            style={{ border: 0 }}
            allowFullScreen={true}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Cicero Web Studio Location"
            className="rounded-xl p-4 sm:p-0"
          />
        </div>
          </div>
        </div>

        {/* Contact Information Section */}

        <div className="flex flex-row gap-4 items-center justify-center">
          {/* Main heading */}

          <div className="flex flex-row gap-4 items-center justify-center"></div>

          {/* Social section */}
          
        </div>

        {/* Google Maps Embed */}
        
      </div>
    </section>
  );
}
