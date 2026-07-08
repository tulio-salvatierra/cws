import { PHONE } from "../../Constants/Constants";
import "./CtaSection.css";

function formatPhone(phone: number) {
  const digits = String(phone);
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export default function CtaSection() {
  return (
    <section id="contact" className="cta-section pb-0 mb-0">
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
