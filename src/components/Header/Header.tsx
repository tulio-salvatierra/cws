import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Link, useLocation } from "react-router-dom";
import { MENU_ITEM } from "../../Constants/Constants";
import Burger from "../../assets/icons/burger.svg";

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

export default function Header() {
  const [showMenu, setShowMenu] = useState(false);
  const [isFloating, setIsFloating] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const toggleMenu = () => setShowMenu(!showMenu);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const header = headerRef.current;
    if (!header) return;

    // Set initial state - header is visible but transparent in hero
    gsap.set(header, {
      backgroundColor: "transparent",
      backdropFilter: "none",
      y: 0
    });

    // Create ScrollTrigger for floating header effect
    ScrollTrigger.create({
      trigger: "body",
      start: "top -100", // Start when scrolled past the hero section
      end: "bottom bottom",
      onUpdate: (self) => {
        const progress = self.progress;
        const isScrolledPastHero = self.scroll() > window.innerHeight * 0.8; // 80% of viewport
        
        if (isScrolledPastHero !== isFloating) {
          setIsFloating(isScrolledPastHero);
          
          if (isScrolledPastHero) {
            // Animate to floating state with slide down effect
            gsap.fromTo(header, 
              {
                y: -100,
                opacity: 0.8
              },
              {
                y: 0,
                opacity: 1,
                backgroundColor: "rgba(39, 39, 42, 0.95)", // bg-zinc-800/95
                backdropFilter: "blur(12px)",
                borderBottom: "1px solid rgba(161, 161, 170, 0.2)", // border-zinc-400/20
                duration: 0.4,
                ease: "power2.out"
              }
            );
          } else {
            // Animate back to transparent state
            gsap.to(header, {
              backgroundColor: "transparent",
              backdropFilter: "none",
              borderBottom: "none",
              duration: 0.3,
              ease: "power2.out"
            });
          }
        }
      },
      onToggle: ({ isActive }) => {
        // Additional logic if needed when entering/leaving trigger area
      }
    });

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, [isFloating]);

  return (
    <div 
      ref={headerRef}
      className={`flex p-3 w-full content-center sticky top-0 z-50 overflow-x-hidden transition-all duration-300 ${
        isFloating 
          ? 'bg-zinc-800/95 backdrop-blur-md border-b border-zinc-400/20 shadow-lg' 
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
            CICERO WEB STUDIO <sup className={`align-super ${
              isFloating ? 'text-sm' : 'text-2xl'
            }`}>®</sup>
          </h1>
        </Link>
        <div className="space-x-8 hidden font-secondary items-start md:flex text-xs tracking-tight">
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
        </div>
        <div className="md:hidden">
          <img
            src={Burger}
            alt="Menu"
            className="w-10 h-10 cursor-pointer"
            onClick={toggleMenu}
          />
        </div>

        {/* Mobile Menu */}
        {showMenu && (
          <nav className="md:hidden bg-zinc-700 fixed top-0 left-0 w-full h-3/4 z-50items-center p-4 justify-between shadow-2xl">
            <div className="content-top flex flex-col text-left gap-3">
              <nav className="flex justify-between">
                <p className="font-extrabold text-4xl text-white p-4 w-25">
                  [CWS]
                </p>{" "}
                <a
                  className="text-main text-4xl mt-4 font-black"
                  onClick={toggleMenu}
                >
                  X
                </a>
              </nav>

              <nav className="flex-col p-4 mb-10 text-left justify-end items-center text-4xl font-black">
                {MENU_ITEM.map((navMobile, index) => (
                  <Link
                    to={navMobile.url}
                    key={index}
                    className={`${navMobile.class} ${location.pathname === navMobile.url ? 'text-orange-500' : ''}`}
                    onClick={toggleMenu}
                  >
                    {navMobile.name}
                  </Link>
                ))}
              </nav>
            </div>
            <a
              href="tel:+17739199161"
              className="p-4 mt-10 rounded-full text-white border-2 font-main font-bold text-2xl  self-center  transition ease-in-out delay-50 hover:-translate-y-1 hover:scale-100 hover:bg-indigo-100 duration-100"
            >
              Book now!
            </a>
            <footer className="p-4 mt-32 bottom-0">
              <div
                className="flex flex-col items-start gap-4"
                onClick={toggleMenu}
              >
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
        )}
      </div>
    </div>
  );
}
