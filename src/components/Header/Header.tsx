import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { gsap } from "gsap";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { MENU_ITEM, PHONE } from "../../Constants/Constants";
import { scrollToSection } from "../../lib/scrollToSection";
import Burger from "../../assets/icons/burger.svg";
import cwsLogo from "../../assets/images/header/cws-logo.svg";
import CustomButton from "../CustomButton";
import { useGSAP } from "@gsap/react";
import "./Header.css";

function CwsLogo() {
  return (
    <img
      src={cwsLogo}
      alt="Cicero Web Studio"
      className="site-header__logo-image"
      width={94}
      height={37}
      draggable={false}
    />
  );
}

function isNavActive(pathname: string, hash: string, url: string) {
  if (url === "/") {
    return pathname === "/" && (!hash || hash === "#hero");
  }

  if (url.startsWith("/#")) {
    return pathname === "/" && hash === url.slice(1);
  }

  return pathname === url;
}

function getSectionIdFromUrl(url: string) {
  if (url.startsWith("/#")) {
    return url.slice(2);
  }

  if (url === "/") {
    return "hero";
  }

  return null;
}

export default function Header() {
  const [showMenu, setShowMenu] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const toggleMenu = () => setShowMenu((open) => !open);

  useEffect(() => {
    document.body.style.overflow = showMenu ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [showMenu]);

  useEffect(() => {
    if (location.pathname !== "/" || !location.hash) return;

    const sectionId = location.hash.slice(1);
    const timer = window.setTimeout(() => {
      scrollToSection(sectionId);
    }, 150);

    return () => window.clearTimeout(timer);
  }, [location.pathname, location.hash]);

  const handleNavClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    url: string,
  ) => {
    setShowMenu(false);

    const sectionId = getSectionIdFromUrl(url);
    if (!sectionId) return;

    event.preventDefault();

    if (location.pathname !== "/") {
      navigate({ pathname: "/", hash: sectionId });
      return;
    }

    const nextUrl = sectionId === "hero" ? "/" : `/#${sectionId}`;
    window.history.pushState(null, "", nextUrl);
    scrollToSection(sectionId);
  };

  useGSAP(
    () => {
      gsap.from(".site-header__bar", {
        y: -80,
        opacity: 0,
        ease: "power3.out",
        duration: 1.2,
        clearProps: "transform,opacity",
      });
    },
    { scope: headerRef },
  );

  return (
    <header ref={headerRef} className="site-header header-container">
      <div className="site-header__bar header-anim">
        <Link
          to="/"
          className="site-header__logo"
          onClick={() => setShowMenu(false)}
        >
          <CwsLogo />
        </Link>

        <nav className="site-header__nav" aria-label="Main navigation">
          {MENU_ITEM.map((nav) => (
            <Link
              key={nav.id}
              to={nav.url}
              onClick={(event) => handleNavClick(event, nav.url)}
              className={`site-header__nav-link header-anim-text ${
                isNavActive(location.pathname, location.hash, nav.url)
                  ? "site-header__nav-link--active"
                  : ""
              }`}
            >
              {nav.name}
            </Link>
          ))}
        </nav>

        <CustomButton
          label="Call now!"
          href={`tel:+1${PHONE}`}
          variant="light"
          size="md"
          className="site-header__cta header-anim-text"
        />

        <button
          type="button"
          aria-label="Toggle menu"
          aria-expanded={showMenu}
          aria-controls="mobile-menu"
          onClick={toggleMenu}
          className="site-header__menu-toggle"
        >
          <img src={Burger} alt="" />
        </button>
      </div>

      {typeof window !== "undefined" &&
        createPortal(
          <div
            id="mobile-menu"
            className={`site-header__mobile-root ${
              showMenu ? "site-header__mobile-root--open" : ""
            }`}
            aria-hidden={!showMenu}
          >
            <div
              onClick={toggleMenu}
              className="site-header__mobile-backdrop"
              aria-hidden="true"
            />

            <nav
              className="site-header__mobile-panel"
              aria-label="Mobile navigation"
            >
              <div className="site-header__mobile-top">
                <Link to="/" onClick={toggleMenu}>
                  <CwsLogo />
                </Link>
                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={toggleMenu}
                  className="site-header__mobile-close"
                >
                  ×
                </button>
              </div>

              <div className="site-header__mobile-links">
                {MENU_ITEM.map((nav) => (
                  <Link
                    key={nav.id}
                    to={nav.url}
                    onClick={(event) => handleNavClick(event, nav.url)}
                    className={`site-header__mobile-link ${
                      isNavActive(location.pathname, location.hash, nav.url)
                        ? "site-header__mobile-link--active"
                        : ""
                    }`}
                  >
                    {nav.name}
                  </Link>
                ))}
              </div>

              <CustomButton
                label="Call now!"
                href={`tel:+1${PHONE}`}
                variant="light"
                size="sm"
                fullWidth
                className="site-header__mobile-cta"
                onClick={toggleMenu}
              />
            </nav>
          </div>,
          document.body,
        )}
    </header>
  );
}
