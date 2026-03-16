import {
  PINTEREST_URL,
  FACEBOOK_URL,
  INSTAGRAM_URL,
  YOUTUBE_URL,
  LINKEDIN_URL,
  TWITTER_URL,
  EMAIL,
  PHONE,
  CALENDLY_URL,
} from "../../Constants/Constants";

import { useEffect, useState, useRef } from "react";
import CustomButton from "../CustomButton/CustomButton";
import { useScramble } from "../../Hooks/useScramble";
import MaskedLines from "../MaskedLines/MaskedLines";
import { useFadeIn } from "../../Hooks/useFadeIn";
import Banner from "../Banner/Banner";

export default function Contact() {
  const [dimensions, setDimensions] = useState({ width: 1920, height: 1080 });

  const scrambleRef2 = useScramble("FOLLOW ME", 0.15);
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
    <section
      id="contact"
      className="relative p- mt-10 w-full min-h-screen flex flex-col items-center justify-center p-1 gap-1 overflow-hidden contact-container animate-in fade-in-0 fade-out-0 duration-300 "
    >
      {/* Main content block */}
      <div className="relative p-4 z-10 text-white w-full rounded-2xl bg-zinc-800/40 backdrop-blur-sm">
        {/* Header with brand name */}
        <div className="text-center p-1">
          <Banner/>
          
          <MaskedLines
            as="p"
            scroll
            scrollStart="top 85%"
            className="font-main text-[2rem] sm:text-[3rem] text-zinc-900 mt-1 text-left mx-auto leading-none tracking-wide w-100"
          >
            Schedule a free 15-minute site audit to discover
            how a strategic website can boost your business.
          </MaskedLines>
        </div>

        {/* Main content area with profile and contact info */}
        <div className="grid grid-cols-2 sm:grid-cols-2 flex-col lg:flex-row items-center lg:items-start gap-12 lg:gap-16">
          {/* Profile Picture Section */}
          <div className="flex-shrink-0 text-center lg:text-left">
            <div className="relative inline-block">
              <div
                ref={fadeInRef}
                className="flex justify-center items-end mx-auto shadow-2xl"
              >
                <img
                  ref={imageRef}
                  src="/images/tulio.png"
                  alt="Tulio Salvatierra"
                  className=" object-cover w-full h-full rounded-md"
                />
              </div>
            </div>
            <h3
              ref={fadeInRef}
              className="text-xl md:text-2xl font-main font-bold text-black mt-6"
            >
              Tulio Salvatierra
            </h3>
            <p
              ref={fadeInRef}
              className="text-black text-sm md:text-base font-secondary"
            >
              Founder & Developer
            </p>
            {/* Email address */}
            <div className="flex flex-col gap-4 items-start justify-start mt-4">
              <MaskedLines
                as="p"
                scroll
                scrollStart="top 85%"
                className="font-main leading-none text-black text-lg w-100"
              >
                I am available for call or emails. Let's talk about your
                project.
              </MaskedLines>

              <div
                ref={fadeInRef}
                className="flex sm:flex-row flex-col gap-1 m-1 items-center justify-start mt-4"
              >
              
                <CustomButton
                  label="Call Us Now"
                  href={`tel:+1${PHONE}`}
                  secondary={true}
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-1 h-full items-center justify-center">
            <h3
              ref={scrambleRef2}
              className="text-xl font-main font-bold sm:text-[4rem] text-[2rem] text-center text-black hover:text-orange-900 transition-colors duration-200 block mb-2"
            >
              FOLLOW ME
            </h3>

            <div ref={fadeInRef} className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-white w-100">
              {[
                { label: "INSTAGRAM", href: INSTAGRAM_URL },
                { label: "YOUTUBE", href: YOUTUBE_URL },
                { label: "FACEBOOK", href: FACEBOOK_URL },
                { label: "TWITTER", href: TWITTER_URL },
                { label: "PINTEREST", href: PINTEREST_URL },
                { label: "LINKEDIN", href: LINKEDIN_URL },
              ].map(({ label, href }) => (
                <div key={label} className="w-fit">
                  <a
                    className="text-white hover:text-orange-900 leading-none font-main font-semibold text-[1.5rem] sm:text-[1.5rem]"
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {label}
                  </a>
                </div>
              ))}
            </div>
            <div
              ref={fadeInRef}
              className="w-full h-auto mt-8 rounded-xl overflow-hidden"
            >
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
