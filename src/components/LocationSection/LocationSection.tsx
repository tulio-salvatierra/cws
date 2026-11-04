import StudioMap from "../Contact/StudioMap";
import "./LocationSection.css";

const DIRECTIONS_URL =
  "https://www.google.com/maps/dir/?api=1&destination=4922+W+Berenice+Ave,+Chicago,+IL+60641";

export default function LocationSection() {
  return (
    <section id="location" className="location-section" aria-labelledby="location-heading">
      <div className="location-section__copy">
        <p className="location-section__eyebrow">Chicago location</p>
        <h2 id="location-heading" className="location-section__title">
          Chicago-based. Built for businesses that need to be found.
        </h2>
        <p className="location-section__description">
          Cicero Web Studio is based in Chicago and works with businesses across Chicagoland.
        </p>
        <a
          className="location-section__directions"
          href={DIRECTIONS_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          Get directions
          <span aria-hidden="true"> ↗</span>
        </a>
      </div>
      <div className="location-section__map">
        <StudioMap />
      </div>
    </section>
  );
}
