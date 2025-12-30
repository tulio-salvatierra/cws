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

import { useEffect, useState, useRef } from "react";
import CustomButton from "../CustomButton/CustomButton";

import { useScramble } from "../../Hooks/useScramble";
import MaskedLines from "../MaskedLines/MaskedLines";
import { useFadeIn } from "../../Hooks/useFadeIn";
import Infinite3DScroll from "../InfiniteScroll/InfiniteScroll";
export default function Contact() {
  const [dimensions, setDimensions] = useState({ width: 1920, height: 1080 });
  
  const scrambleRef2 = useScramble("SOCIAL", 0.15);
  const fadeInRef = useFadeIn();
  const imageRef = useRef<HTMLImageElement>(null);
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
    <section className="relative mt-10 w-full min-h-screen flex flex-col items-center justify-center p-4 gap-8 overflow-hidden contact-container animate-in fade-in-0 fade-out-0 duration-300 ">
      {/* InfiniteScroll Background */}
      <div className="absolute inset-0 w-full h-full z-0">
        <Infinite3DScroll />
      </div>

      {/* Main content block */}
      <div className="relative z-10 text-white w-full rounded-2xl p-4 bg-zinc-800/01 backdrop-blur-xs">
        {/* Header with brand name */}
        <div className="text-center mb-12">
          <h1 
            
            className="text-6xl text-left md:text-8xl lg:text-9xl text-orange-500 font-main font-black mb-4"
          >
            Web Design Consultation | Get in Touch
          </h1>
          <p className="text-xl text-zinc-300 mt-6 max-w-2xl mx-auto">
            Schedule a free web design consultation with a local web designer Chicago. Let's discuss your project and create something amazing together.
          </p>
        </div>

        {/* Main content area with profile and contact info */}
        <div className="grid grid-cols-2 sm:grid-cols-2 flex-col lg:flex-row items-center lg:items-start gap-12 lg:gap-16">
          {/* Profile Picture Section */}
          <div className="flex-shrink-0 text-center lg:text-left">
            <div className="relative inline-block">
              <div ref={fadeInRef} className="flex justify-center items-end mx-auto shadow-2xl">
                <img
                  ref={imageRef}
                  src="/images/tulio.png"
                  alt="Tulio Salvatierra"
                  className=" object-cover w-full h-64 rounded-md"
                />
              </div>
              
            </div>
            <h3 ref={fadeInRef} className="text-xl md:text-2xl font-main font-bold text-white mt-6">
              Tulio Salvatierra
            </h3>
            <p ref={fadeInRef} className="text-zinc-100 text-sm md:text-base font-secondary">
              Founder & Developer
            </p>
            {/* Email address */}
            <div className="flex flex-col gap-4 items-start justify-start mt-4">
              <MaskedLines
                as="p"
                scroll
                scrollStart="top 85%"
                className="font-secondary leading-none text-zinc-100 text-lg w-100 font-secondary"
              >
                I am available for call or emails. Let's talk about your project.
              </MaskedLines>
              
              <div ref={fadeInRef} className="flex sm:flex-row flex-col gap-4 items-center justify-start mt-4">
                <CustomButton label="Email Us" href={`mailto:${EMAIL}`} />
                <CustomButton label="Call Us" href={`tel:+1${PHONE}`} />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-4 items-center justify-center">
            <h3 ref={scrambleRef2}  className="text-xl font-main font-bold sm:text-2xl text-left md:text-xl lg:text-2xl xl:text-3xl text-orange-500 hover:text-orange-900 transition-colors duration-200 block mb-2">
              SOCIAL
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-zinc-300">
              <div ref={fadeInRef} className="w-fit">
                <a
                  className="text-zinc-100 leading-none font-secondary font-semibold"
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  INSTAGRAM
                </a>
              </div>
              <div ref={fadeInRef} className="w-fit">
                <a
                  className="text-zinc-100 text-left font-secondary font-semibold"
                  href={YOUTUBE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  YOUTUBE
                </a>
              </div>
              <div ref={fadeInRef} className="w-fit">
                <a
                  className="text-zinc-100 font-secondary font-semibold"
                  href={FACEBOOK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  FACEBOOK
                </a>
              </div>
              <div ref={fadeInRef} className="w-fit">
                <a
                  className="text-zinc-100 font-secondary font-semibold"
                  href={TWITTER_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  TWITTER
                </a>
              </div>
              <div ref={fadeInRef} className="w-fit">
                <a
                  className="text-zinc-100 font-secondary font-semibold"
                  href={PINTEREST_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  PINTEREST
                </a>
              </div>
              <div ref={fadeInRef} className="w-fit">
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
            <div ref={fadeInRef} className="w-full mt-8 rounded-xl overflow-hidden">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d252.5880090363163!2d-87.7509307390869!3d41.95077474768748!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x880fcde85586be3d%3A0x88f84b57cb03f35b!2sCicero%20Web%20Studio!5e1!3m2!1sen!2sus!4v1761046047715!5m2!1sen!2sus"
            width="100%"
            height="100%"
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
