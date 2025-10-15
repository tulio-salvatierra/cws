import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Link, useLocation } from "react-router-dom";
import { useModal } from "../LeadFormModal/ModalContext";
import { CALENDLY_URL, MENU_ITEM } from "../../Constants/Constants";
import Burger from "../../assets/icons/burger.svg";
import CustomButton from "../CustomButton";

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

export default function Header() {
  const { openLeadForm } = useModal();
  const [showMenu, setShowMenu] = useState(false);
  const [isFloating, setIsFloating] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const toggleMenu = () => setShowMenu(!showMenu);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const header = headerRef.current;
    if (!header) return;

    // Set initial state - subtle glass effect in hero
    gsap.set(header, {
      backgroundColor: "rgba(39, 39, 42, 0.4)", // bg-zinc-800/40
      backdropFilter: "blur(8px)",
      borderBottom: "1px solid rgba(161, 161, 170, 0.10)", // border-zinc-400/10
      y: 0
    });

    // Create ScrollTrigger for floating header effect
    ScrollTrigger.create({
      trigger: "body",
      start: "top -50", // Start when scrolled past the hero section
      end: "bottom bottom",
      onUpdate: (self) => {
        const scrollY = self.scroll();
        const heroHeight = window.innerHeight;
        const isScrolledPastHero = scrollY > heroHeight * 0.3; // 30% of viewport height
        
        if (isScrolledPastHero !== isFloating) {
          setIsFloating(isScrolledPastHero);
          
          if (isScrolledPastHero) {
            // Animate to floating state
            gsap.to(header, {
              backgroundColor: "rgba(39, 39, 42, 0.95)", // bg-zinc-800/95
              backdropFilter: "blur(12px)",
              borderBottom: "1px solid rgba(161, 161, 170, 0.2)", // border-zinc-400/20
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
              duration: 0.4,
              ease: "power2.out"
            });
          } else {
            // Animate back to subtle glass state
            gsap.to(header, {
              backgroundColor: "rgba(39, 39, 42, 0.4)",
              backdropFilter: "blur(8px)",
              borderBottom: "1px solid rgba(161, 161, 170, 0.10)",
              boxShadow: "none",
              duration: 0.3,
              ease: "power2.out"
            });
          }
        }
      }
    });

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, [isFloating]);

  return (
    <div 
      ref={headerRef}
      className={`flex p-3 w-full content-center fixed top-0 left-0 right-0 z-40 overflow-x-hidden transition-all duration-300 ${
        isFloating 
          ? 'bg-zinc-800/90 backdrop-blur-md border-b border-zinc-400/20 shadow-lg' 
          : 'bg-transparent'
      }`}
    >
      <div className="flex w-full p-6 justify-between items-center">
        {/* Desktop Header */}
        <Link to="/" className="no-underline">
          <h1 className={`text-orange-500 font-bold tracking-tight transition-all duration-300 ${
            isFloating 
              ? 'text-3xl md:text-4xl' 
              : 'text-6xl md:text-8xl'
          }`}>
            CWS <sup className={`align-super ${
              isFloating ? 'text-sm' : 'text-2xl'
            }`}>®</sup>
          </h1>
        </Link>
        <div className="space-x-8 hidden font-secondary items-center md:flex text-xs tracking-tight">
          {MENU_ITEM.map((nav, index) => (
            <Link
              to={nav.url}
              key={index}
              className={`${nav.class} ${location.pathname === nav.url ? 'text-orange-500' : ''}`}
              onClick={toggleMenu}
            >
              {nav.name}
            </Link>
          ))}
          <CustomButton href={CALENDLY_URL} label="BOOK MY CONSULTATION" />
        </div>
        <div className="md:hidden">
          <button
            aria-label="Toggle menu"
            aria-expanded={showMenu}
            aria-controls="mobile-menu"
            onClick={toggleMenu}
            className="w-10 h-10 cursor-pointer grid place-items-center"
          >
            <img src={Burger} alt="Menu" className="w-8 h-8" />
          </button>
        </div>

        {/* Mobile Menu - always mounted for smooth transitions */}
        <div
          id="mobile-menu"
          className={`md:hidden fixed inset-0 z-40 ${showMenu ? 'pointer-events-auto' : 'pointer-events-none'}`}
          aria-hidden={!showMenu}
        >
          {/* Backdrop */}
          <div
            onClick={toggleMenu}
            className={`absolute inset-0 bg-black/10 transition-opacity duration-300 ease-out ${showMenu ? 'opacity-100' : 'opacity-0'}`}
          />

          {/* Panel */}
          <nav
            className={`absolute top-0 left-0 w-full max-h-auto overflow-y-auto bg-zinc-800/95 backdrop-blur-md border-b border-zinc-400/20 p-4 shadow-2xl transform transition-transform duration-300 ease-out ${showMenu ? 'translate-y-0' : '-translate-y-full'}`}
          >
            <div className="content-top flex flex-col text-left gap-3">
              <div className="flex justify-between items-center">
                <p className="font-extrabold text-3xl text-white p-2">[CWS]</p>
                <button
                  aria-label="Close menu"
                  onClick={toggleMenu}
                  className="text-main text-3xl font-black px-3 py-1"
                >
                  ×
                </button>
              </div>

              <div className="flex-col p-4 mb-6 text-left justify-end items-center text-3xl font-black">
                {MENU_ITEM.map((navMobile, index) => (
                  <Link
                    to={navMobile.url}
                    key={index}
                    className={`${navMobile.class} block py-2 ${location.pathname === navMobile.url ? 'text-orange-500' : ''}`}
                    onClick={toggleMenu}
                  >
                    {navMobile.name}
                  </Link>
                ))}
              </div>
            </div>
            <a
              href={CALENDLY_URL}
              className="block p-4 rounded-full text-white border-2 font-main font-bold text-2xl text-center transition ease-in-out delay-50 hover:-translate-y-1 hover:scale-100 hover:bg-indigo-100 duration-100"
            >
              Book My Consultation!
            </a>
            <button
              onClick={openLeadForm}
              className="mt-6 w-full btn-bounce"
            >
              <div className="btn-bounce-bg"></div>
              <div className="btn-bounce-text__wrap">
                <span className="btn-bounce-text">Get a Quote</span>
              </div>
            </button>
            <footer className="p-4 mt-10">
              <div className="flex flex-col items-start gap-2">
                <a href="#" className="flex items-center gap-2">
                  CSW
                </a>
                <p className="text-muted-foreground text-left max-w-md font-second">
                  Our mission is to deliver tailored websites and software
                  solutions that solve real problems and drive meaningful
                  growth.
                </p>
              </div>
            </footer>
          </nav>
        </div>
      </div>
    </div>
  );
}
