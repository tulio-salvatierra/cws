import { PHONE } from "../../Constants/Constants";
import CustomButton from "../CustomButton";
import ctaVideo from "../../assets/video/website.mp4";
import ctaPoster from "../../assets/images/website.jpg";
import "./CtaSection.css";

function formatPhone(phone: number) {
  const digits = String(phone);
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export default function CtaSection() {
  return (
    <section id="contact" className="cta-section pb-0 mb-0 h-screen">
      <div className="cta-section__panel">
        <video
          className="cta-section__video"
          src={ctaVideo}
          poster={ctaPoster}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          disablePictureInPicture
          disableRemotePlayback
          aria-hidden="true"
        />
        <div className="cta-section__overlay" aria-hidden="true" />

        <div className="cta-section__content">
          <h2 className="cta-section__title">Let's <span className="text-primary">talk!</span></h2>
          <p className="cta-section__description">
            I want to help you uncover your story, find your voice, and
            shape it into sharp positioning and a website strategy that connects with your audience.
          </p>
          <CustomButton
            label="Call now!"
            mobileLabel={formatPhone(PHONE)}
            href={`tel:+1${PHONE}`}
            variant="primary"
            className="cta-section__button"
          />
        </div>
      </div>
    </section>
  );
}
