import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PHONE } from "../../Constants/Constants";
import websiteVideo from "../../assets/video/website.mp4";
import "./CtaSection.css";

gsap.registerPlugin(ScrollTrigger);

function formatPhone(phone: number) {
  const digits = String(phone);
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export default function CtaSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const video = sectionRef.current?.querySelector<HTMLElement>(
        ".cta-section__video",
      );
      const contentItems = gsap.utils.toArray<HTMLElement>([
        ".cta-section__title",
        ".cta-section__description",
        ".cta-section__button",
      ]);

      if (!video) return;

      gsap.set(video, {
        scale: 1.3,
        transformOrigin: "center center",
      });
      gsap.set(contentItems, { opacity: 0, y: 48 });

      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 90%",
          once: true,
        },
      });

      tl.to(video, {
        scale: 1,
        duration: 1.35,
      }).to(
        contentItems,
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          stagger: 0.14,
        },
        "-=0.75",
      );
    },
    { scope: sectionRef },
  );

  return (
    <section ref={sectionRef} id="contact" className="cta-section">
      <div className="cta-section__media" aria-hidden="true">
        <video
          className="cta-section__video"
          src={websiteVideo}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          disablePictureInPicture
          disableRemotePlayback
          onCanPlay={(e) => {
            e.currentTarget.play().catch(() => {});
          }}
        />
      </div>
      <div className="cta-section__panel">
        <h2 className="cta-section__title">We uncover your story</h2>
        <p className="cta-section__description">
          We dig deep into your brand, surface what makes you irreplaceable, and
          shape it into sharp positioning and a website strategy that connects in
          seconds.
        </p>
        <a href={`tel:+1${PHONE}`} className="cta-section__button">
          <span className="cta-section__button-label--desktop">Call now!</span>
          <span className="cta-section__button-label--mobile">
            {formatPhone(PHONE)}
          </span>
        </a>
      </div>
    </section>
  );
}
