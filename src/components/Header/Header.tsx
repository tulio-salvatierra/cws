import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Link, useLocation } from "react-router-dom";
import { useModal } from "../LeadFormModal/ModalContext";
import { CALENDLY_URL, MENU_ITEM } from "../../Constants/Constants";
import Burger from "../../assets/icons/burger.svg";
import CustomButton from "../CustomButton";
import {useScramble} from "../../Hooks/useScramble";
import {useFadeIn} from "../../Hooks/useFadeIn";
import MaskedLines from "../MaskedLines/MaskedLines";


// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

export default function Header() {
  const { openLeadForm } = useModal();
  const [showMenu, setShowMenu] = useState(false);
  const [isFloating, setIsFloating] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const toggleMenu = () => setShowMenu(!showMenu);
  const scrambleRef = useScramble("CWS", 0.1);
  const fadeInRef = useFadeIn();
 

  return (
    <div 
 
      className={`bg-zinc-800/90 backdrop-blur-md flex p-3 w-full content-center fixed top-0 left-0 right-0 z-50 overflow-x-hidden transition-all duration-300 ${
        isFloating 
          ? 'bg-zinc-800/90 backdrop-blur-md border-b border-zinc-400/20 shadow-lg' 
          : 'bg-transparent'
      }`}
    >
      <div className="flex w-full p-6 justify-between items-center">
        {/* Desktop Header */}
        <Link to="/" className="no-underline">
          <div ref={fadeInRef}>
         <h1 ref={scrambleRef} className="text-orange-500 font-semibold tracking-tight transition-all duration-300">
          CWS
         </h1>
          </div>
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

        {/* Mobile Menu - rendered via portal to escape stacking context */}
        {typeof window !== 'undefined' && createPortal(
          <div
            id="mobile-menu"
            className={`md:hidden fixed inset-0 z-[9999] ${showMenu ? 'pointer-events-auto' : 'pointer-events-none'}`}
            aria-hidden={!showMenu}
          >
            {/* Backdrop with blur */}
            <div
              onClick={toggleMenu}
              className={`absolute inset-0 z-0 bg-black/60 backdrop-blur-md transition-all duration-300 ease-out ${showMenu ? 'opacity-100' : 'opacity-0'}`}
            />

            {/* Panel */}
            <nav
              className={`absolute top-0 left-0 z-10 w-full max-h-auto overflow-y-auto bg-zinc-800/95 backdrop-blur-md border-b border-zinc-400/20 p-4 shadow-2xl transform transition-transform duration-300 ease-out ${showMenu ? 'translate-y-0' : '-translate-y-full'}`}
            >
            <div className="content-top flex flex-col text-left gap-3">
              <div className="flex justify-between items-center">
                <MaskedLines
                  as="p"
                  className="font-semibold text-3xl text-orange-500 p-2"
                >
                  [CWS]
                </MaskedLines>
                <button
                  aria-label="Close menu"
                  onClick={toggleMenu}
                  className="text-main text-orange-500 text-3xl font-black px-3 py-1"
                >
                  ×
                </button>
              </div>

              <div ref={fadeInRef} className="flex-col p-4 mb-6 text-left justify-end items-center text-xl font-semibold">
                {MENU_ITEM.map((navMobile, index) => (
                  <div key={index}>
                  <Link
                    to={navMobile.url}
                    
                    className={`${navMobile.class} block py-2 text-xl tracking-tight font-semibold text-orange-100 ${location.pathname === navMobile.url ? 'text-orange-500' : ''}`}
                    onClick={toggleMenu}
                    >
                      {navMobile.name}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
            <div ref={fadeInRef}>
            <a
              ref={fadeInRef as unknown as React.RefObject<HTMLAnchorElement>}
              href={CALENDLY_URL}
              className="block p-4 rounded-full text-white border-2 font-main font-semibold text-xl text-center transition ease-in-out delay-50 hover:-translate-y-1 hover:scale-100 hover:bg-indigo-100 duration-100"
            >
              Book My Consultation!
            </a>
            </div>
            <div ref={fadeInRef}>
              
            </div>
            <button
              ref={fadeInRef as unknown as React.RefObject<HTMLButtonElement>}
              onClick={openLeadForm}
              className="mt-6 w-full btn-bounce text-lg tracking-tight"
            >
              <div className="btn-bounce-bg"></div>
              <div className="btn-bounce-text__wrap">
                <span className="btn-bounce-text">Get a Quote</span>
              </div>
            </button>
            <footer className="p-4 mt-10">
              <div className="flex flex-col items-start gap-2">
                
                <MaskedLines
                  as="p"
                  scroll
                  scrollStart="top 90%"
                  className="text-zinc-300 text-left max-w-md font-second text-lg tracking-tight"
                >
                  Our mission is to deliver tailored websites and software
                  solutions that solve real problems and drive meaningful
                  growth.
                </MaskedLines>
              </div>
            </footer>
          </nav>
        </div>,
        document.body
        )}
      </div>
    </div>
  );
}
