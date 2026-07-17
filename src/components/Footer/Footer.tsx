import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ABOUT_SECTION_URL,
  EMAIL,
  HOME_URL,
  INSTAGRAM_URL,
  LINKEDIN_URL,
  PHONE,
  SERVICES_SECTION_URL,
  TWITTER_URL,
  WORK_SECTION_URL,
  YOUTUBE_URL,
} from "../../Constants/Constants";
import Decorative from "../../assets/images/Frame13.svg";
import arrowUpIcon from "../../assets/images/footer/arrow-up.svg";
import CustomButton from "../CustomButton";
import "./Footer.css";

const FOOTER_NAV = [
  { label: "About", url: ABOUT_SECTION_URL },
  { label: "Works", url: WORK_SECTION_URL },
  { label: "Services", url: SERVICES_SECTION_URL },
  { label: "Process", url: "/#process" },
  { label: "Contact", url: "/#contact" },
] as const;

const FOOTER_SOCIALS = [
  { label: "LinkedIn", url: LINKEDIN_URL },
  { label: "YouTube", url: YOUTUBE_URL },
  { label: "Instagram", url: INSTAGRAM_URL },
  { label: "X", url: TWITTER_URL },
] as const;

function formatPhone(phone: number) {
  const digits = String(phone);
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function formatFooterDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default function Footer() {
  const lenisRef = useRef<{ scrollTo: (target: number, options?: { duration?: number }) => void } | null>(null);
  const footerDate = formatFooterDate(new Date());

  useEffect(() => {
    if (typeof window !== "undefined") {
      lenisRef.current = (window as Window & { lenis?: typeof lenisRef.current }).lenis ?? null;
    }
  }, []);

  const scrollToTop = () => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { duration: 1.5 });
      return;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="site-footer">
      <div className="site-footer__decorative" aria-hidden>
        <img
          src={Decorative}
          alt=""
          className="site-footer__decorative-image"
          draggable={false}
        />
      </div>

      <div className="site-footer__inner">
        <div className="site-footer__columns">
          <div className="site-footer__column site-footer__column--navigate">
            <h2 className="site-footer__column-heading">Navigate</h2>
            <nav className="site-footer__nav" aria-label="Footer navigation">
              {FOOTER_NAV.map((item) => (
                <Link
                  key={item.label}
                  to={item.url}
                  className="site-footer__nav-link"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="site-footer__column site-footer__column--contact">
            <h2 className="site-footer__column-heading">Contact</h2>
            <div className="site-footer__contact">
              <CustomButton
                label={EMAIL}
                href={`mailto:${EMAIL}`}
                variant="primary"
                size="pill"
              />
              <CustomButton
                label={formatPhone(PHONE)}
                href={`tel:+1${PHONE}`}
                variant="secondary"
                size="pill"
              />
            </div>
          </div>

          <div className="site-footer__column site-footer__column--socials">
            <h2 className="site-footer__column-heading">Socials</h2>
            <nav className="site-footer__nav" aria-label="Social links">
              {FOOTER_SOCIALS.map((item) => (
                <a
                  key={item.label}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="site-footer__nav-link"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </div>

        <div className="site-footer__bottom">
          <div className="site-footer__meta">
            <p>Chicago, IL. 60641</p>
            <p>{footerDate}</p>
          </div>

          <button
            type="button"
            className="site-footer__back-to-top"
            onClick={scrollToTop}
          >
            Back to Top
            <img
              src={arrowUpIcon}
              alt=""
              className="site-footer__back-to-top-icon"
              width={21}
              height={21}
            />
          </button>

          <p className="site-footer__brand">
            <Link to={HOME_URL}>Cicero Web Studio</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
