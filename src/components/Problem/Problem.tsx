import { useState, useEffect } from "react";
import { MeshGradient } from "@paper-design/shaders-react";
import CustomButton from "../CustomButton";
import Logo from "./../../assets/video/hero.mp4";
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
      duration: 6,
      borderRadius: "800px",
      width: "50%",
      ease: "power1.out",
      scrollTrigger: {
        trigger: ".video-background-container",
        start: "top 35%",
        end: "bottom bottom",
        scrub: 2,
      },
    });
  }, []);

  return (
    <section className="p-5 flex flex-col w-full justify-evenly overflow-x-hidden bg-[#f97316]">
      
        
        <MaskedLines
          as="h1"
          scroll
          className="font-main text-left font-semibold text-black sm:text-[9rem] text-[2rem] w-100 leading-none tracking-normal"
        >
          CICERO WEB STUDIO
        </MaskedLines>
      

      <div className="flex justify-center items-start h-auto w-100">
        <div className="grid items-center w-100 mb-28 gap-2 h-auto p-1">
        <strong className="text-white text-left">
          <MaskedLines scroll scrollStart="top 85%" className="text-white text-left p-1">[INTRODUCING]</MaskedLines>
        </strong>
          <MaskedLines
            as="p"
            scroll
            scrollStart="top 85%"
            className="p-6 mx-auto font-main text-zinc-900 text-2xl xl md:text-5xl text-start paragraph tracking-10 leading-none w-screen p-1"
          >
            I'm Tulio, truck driver turned web developer. I reached all my goals while driving across the country and always had a passion technology and it's power to do amazing thing and changes people's lives. As an entrepreneur, I want to work with small businesses in Chicago to help them grow, reach their goals and succeed by being a partner in their process and using tools (or build them) to help them achieve their goals.
          </MaskedLines>

          <div>
            <div className="w-screen relative left-1/2 -translate-x-1/2 mb-4 z-10 shrink-0" style={{ height: "50dvh" }}>
              <UnicornScenePage />
            </div>
            <div
              ref={fadeInRef}
              className="flex flex-col text-start w-screen text-white paragraph"
            >
              <MaskedLines as="p" className="font-main extralight text-zinc-900 text-2xl xl md:text-5xl text-start paragraph tracking-10 leading-tight w-screen p-6">
                I'm a local entrepreneur with a passion for web design and development. I have years of operations and logistics
                experience and I understand what Chicago businesses need: websites that actually bring in customers. I work shoulder to shoulder with you to create elegant, effective solutions—always with a can‑do attitude and the dedication to go the extra mile.
              </MaskedLines>
            </div>

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
          className="video-background relative z-10 w-screen video-anim h-full object-cover mx-auto"
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
  );
}
