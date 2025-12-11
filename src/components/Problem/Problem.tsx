import CustomButton from "../CustomButton";
import Logo from "./../../assets/video/hero.mp4";
import MaskedLines from './../MaskedLines/MaskedLines'
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import "./video.css";
import ScrollTrigger from "gsap/ScrollTrigger";


export default function Problem() {

  useGSAP(
    () => {
      // Animamos los elementos marcados con la clase .hero-anim
      gsap.from(".video-anim", {
        y: -30,
        duration: 3,

        ease: "power2.out",
      });
    },
    []);
    
    
    
    useGSAP(() => {
    
      gsap.from(".video-background", {
        y: -30,
        duration: 3,
        ease: "power2.out",
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
          className="font-main text-left font-semibold text-orange-500 sm:text-[6rem] text-[3rem] w-100 leading-tight"
        >
          CICERO WEB STUDIO
        </MaskedLines>
      </div>

      <div className="flex justify-center items-start h-auto w-full mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 sm:[grid-template-rows:1fr] mb-28 gap-28 h-auto w-full">
          <MaskedLines
            as="p"
            scroll
            scrollStart="top 85%"
            className="font-secondary text-zinc-400 text-lg text-start paragraph"
          >
            We're your digital growth partners. Based in Chicago, we combine
            beautiful design with dedication to deliver solutions that move the
            needle for your business.
          </MaskedLines>

          <div>
            <div className="flex flex-col text-start w-full text-white paragraph">
              <MaskedLines
                as="h2"
                scroll
                once
                scrollStart="top 85%"
                className="font-secondary font-medium sm:text-6xl text-5xl text-orange-500/80 w-full leading-tight mb-4"
              >
                What makes us different?
              </MaskedLines>
              <MaskedLines
                as="p"
                scroll
                scrollStart="top 85%"
                className="font-secondary text-lg text-zinc-400 flex-1 paragraph"
              >
                Partnership approach: <br /> Your wins are our wins.
                Problem-solving mindset with a can-do attitude. Elegant design
                meets relentless execution. We go the extra mile, every single
                time.
              </MaskedLines>
            </div>

            <div

              className="flex flex-col sm:flex-row gap-4 mt-8"
            >
              <CustomButton href="/contact" label="Let's talk" />
              <CustomButton href="/works" label="See our works" />
            </div>
          </div>
        </div>
      </div>
      <div>
        
        <video
          src={Logo}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          disablePictureInPicture
          disableRemotePlayback
          className="video-background rounded-tl-[300px] rounded-tr-[300px] rounded-br-[300px] rounded-bl-[300px] w-full video-anim h-50 object-cover transition-transform duration-300 group-hover:scale-25"
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