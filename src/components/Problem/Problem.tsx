import { useState, useEffect, useRef } from "react";
import { MeshGradient } from "@paper-design/shaders-react";
import CustomButton from "../CustomButton";
import Logo from "./../../assets/video/hero.mp4";
import introBg from "../../assets/Images/intro.jpg";
import MaskedLines from "./../MaskedLines/MaskedLines";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import "./video.css";
import { useFadeIn } from "../../Hooks/useFadeIn";
import { useScramble } from "../../Hooks/useScramble";
import { CALENDLY_URL } from "../../Constants/Constants";
import UnicornScenePage from "../USS/UnicornScene";
import BannerPartner from "../BannerPartner";

export default function Problem() {
  const problemRef = useRef<HTMLDivElement>(null);
  const scrambleRef = useScramble("WHAT MAKES US DIFFERENT?", 0.1);
  const fadeInRef = useFadeIn();
  const [size, setSize] = useState({ width: 1280, height: 720 });

  useEffect(() => {
    const updateSize = () =>
      setSize({ width: window.innerWidth, height: window.innerHeight });
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useGSAP(() => {
    gsap.from(".video-background", {
      duration: 3.5,
      borderRadius: "800px 0 800px 0",
      width: "70%",
      ease: "power3.inOut",
      yPercent: -100,
      scrollTrigger: {
        trigger: ".video-background-container",
        start: "top 50%",
        end: "bottom bottom",
        scrub: 4,
      },
    });
  }, []);

  return (
    <section
      ref={problemRef}
      id="problem"
      className="flex flex-col w-full overflow-x-hidden"
    >
      <section className="relative z-10 h-screen problem-intro-container">
      <div
        className="problem-intro relative w-full bg-cover sm:bg-center bg-left bg-no-repeat"
        style={{ backgroundImage: `url(${introBg})` }}
      >
        <div className="absolute inset-0 bg-[#f97316]/55" aria-hidden />
        <div className="relative z-10 p-5 flex flex-col w-full justify-between min-h-[min(100vh,960px)]">
          <MaskedLines
            as="h1"
            scroll
            className="font-main text-center font-semibold text-white sm:text-[10rem] text-[3rem] w-100 leading-none tracking-normal"
          >
            CICERO WEB STUDIO
          </MaskedLines>

          <div className="flex justify-center items-start h-auto w-100">
            <div className="grid items-center w-100 mb-28 gap-2 h-auto p-1">
              <span className="fromBelow text-white text-left p-6">
                <MaskedLines
                  scroll
                  scrollStart="top 85%"
                  className="text-orange-500 text-left font-light text-sm"
                >
                  [INTRO]
                </MaskedLines>
              </span>

              <MaskedLines
                as="p"
                scroll
                scrollStart="top 85%"
                className="mx-auto font-main text-zinc-900 text-2xl xl md:text-4xl text-start paragraph tracking-10 leading-none w-screen p-1"
              >
                I’m Tulio, a local entrepreneur with a passion for web design,
                development, music, creativity, and technology. I help small
                businesses in Chicago and the Chicagoland area create a stronger
                online presence and use digital tools more effectively. Whether
                you need a website built from scratch, improvements to an
                existing site, branded photo and video content, or custom AI
                automation to save time and reduce costs, my goal is to help
                your business look more professional, work more efficiently, and
                grow with confidence.
              </MaskedLines>

              <div>
                <div className="flex flex-col sm:flex-row gap-4 mt-8 p-6 w-auto">
                  <CustomButton
                    href={CALENDLY_URL}
                    label="Book Free 15-Min Site Audit →"
                    newTab={true}
                  />
                  <CustomButton
                    href="#projects"
                    label="See Recent Work ↓"
                    secondary={true}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <BannerPartner />
      <div className="video-background-container relative w-full overflow-hidden">
        {/* Mesh gradient background behind the video */}

        <video
          src={Logo}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          disablePictureInPicture
          disableRemotePlayback
          className="video-background relative z-10 w-screen video-anim h-full object-cover mx-auto shadow-2xl"
          onEnded={(e) => {
            e.currentTarget.currentTime = 0;
            e.currentTarget.play();
          }}
          onLoadStart={(e) => {
            // Ensure video starts playing immediately when loaded
            e.currentTarget.play().catch(() => {
              // Fallback if autoplay fails
              console.log("Autoplay prevented, will retry on user interaction");
            });
          }}
          onCanPlay={(e) => {
            // Start playing as soon as video can play
            e.currentTarget.play().catch(() => {
              // Silent fallback
            });
          }}
        />
      </div>
    </section>
    </section>
  );
}
