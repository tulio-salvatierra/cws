import CustomButton from "../CustomButton";
import Logo from "./../../assets/video/hero.mp4";
import MaskedLines from './../MaskedLines/MaskedLines'
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import "./video.css";
import { useFadeIn } from "../../Hooks/useFadeIn";
import { useScramble } from "../../Hooks/useScramble";
import { CALENDLY_URL } from "../../Constants/Constants";
  


export default function Problem() {

  const scrambleRef = useScramble("WHAT MAKES US DIFFERENT?", 0.1);
  const fadeInRef = useFadeIn();



  useGSAP(() => {

    gsap.from(".video-background", {
      duration: 10,
      opacity: 0.1,
      borderRadius: "600px 600px 600px 600px",
      ease: "power2.out",
      scrollTrigger: {
        trigger: ".video-background-container",
        start: "top 100%",
        end: "top 0%",
        scrub: 4,
      }
    });
  }, []);

  return (
    <section
      className="p-5 h-auto flex flex-col w-full justify-evenly mt-80 overflow-x-hidden"
    >
      <div className="flex flex-col mb-10">
        <strong className="text-white text-left">
          <MaskedLines>
            [INTRODUCING]
          </MaskedLines>
        </strong>
        <MaskedLines
          as="h1"
          scroll
          className="font-main text-left font-semibold text-orange-500 sm:text-[6rem] text-[3rem] w-100 leading-12"
        >
          CICERO WEB STUDIO
        </MaskedLines>
      </div>

      <div className="flex justify-center items-start h-auto w-full mb-8 ">
      
        <div className="grid grid-cols-1 sm:grid-cols-2 sm:[grid-template-rows:1fr] mb-28 gap-28 h-auto w-full">
          <MaskedLines
            as="p"
            scroll
            scrollStart="top 85%"
            className="font-secondary text-zinc-300 text-xl md:text-2xl text-start paragraph tracking-10 leading-relaxed"
          >
            I'm Tulio — ex-logistics pro turned web dev. After years running operations, I now build modern, fast websites for small businesses in Humboldt Park, Portage Park & greater Chicago. No fluff, just results: more bookings, calls, and sales.
          </MaskedLines>

          <div>
            <div ref={fadeInRef} className="flex flex-col text-start w-full text-white paragraph">
              <h2 ref={scrambleRef} className="font-secondary text-orange-400 text-2xl sm:text-4xl text-start paragraph tracking-10 mb-4">What makes us different?</h2>
              <p className="font-secondary text-zinc-300 text-lg md:text-xl text-start paragraph tracking-10 leading-relaxed">
                At Cicero Web Studio, your success is our success. We're a local studio that pairs Tulio's years of operations and logistics experience with his passion for web design and development. We work shoulder‑to‑shoulder with you to create elegant, effective solutions—always with a can‑do attitude and the dedication to go the extra mile. Based right here in 60641, we understand what Chicago businesses need: websites that actually bring in customers.
              </p>
            </div>

            <div
              className="flex flex-col sm:flex-row gap-4 mt-8"
            >
              <CustomButton href={CALENDLY_URL} label="Book Free 15-Min Site Audit →" newTab={true} />
              <CustomButton href="#projects" label="See Recent Work ↓" secondary={true} />
            </div>
          </div>
        </div>
      </div>
      <div className="video-background-container">

        <video
          src={Logo}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          disablePictureInPicture
          disableRemotePlayback
          className="video-background rounded-tl-[6px] rounded-tr-[600px] rounded-br-[6px] rounded-bl-[600px] w-full video-anim h-50 object-cover transition-transform duration-300 group-hover:scale-25"
          onEnded={(e) => {
            e.currentTarget.currentTime = 0;
            e.currentTarget.play();
          }}
          onLoadStart={(e) => {
            // Ensure video starts playing immediately when loaded
            e.currentTarget.play().catch(() => {
              // Fallback if autoplay fails
              console.log('Autoplay prevented, will retry on user interaction');
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