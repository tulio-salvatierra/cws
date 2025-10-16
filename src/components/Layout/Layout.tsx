import { Outlet } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import Header from '../Header/Header';
import Breadcrumbs from '../Breadcrumbs';
import { ModalProvider } from '../LeadFormModal/ModalContext';
import Footer from '../Footer/Footer';

export default function Layout() {
  const svgRef = useRef<HTMLDivElement>(null);
  const orb1Ref = useRef<HTMLDivElement>(null);
  const orb2Ref = useRef<HTMLDivElement>(null);
  const orb3Ref = useRef<HTMLDivElement>(null);
  const orb4Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      
      // Parallax effect for SVG pattern (slowest movement)
      if (svgRef.current) {
        svgRef.current.style.transform = `translateY(${scrollY * 0.2}px)`;
      }
      
      // Parallax effect for orbs (different speeds for depth)
      if (orb1Ref.current) {
        orb1Ref.current.style.transform = `translateY(${scrollY * 0.3}px) translateX(${scrollY * 0.1}px)`;
      }
      if (orb2Ref.current) {
        orb2Ref.current.style.transform = `translateY(${scrollY * -0.2}px) translateX(${scrollY * -0.15}px)`;
      }
      if (orb3Ref.current) {
        orb3Ref.current.style.transform = `translateY(${scrollY * 0.4}px) translateX(${scrollY * 0.2}px)`;
      }
      if (orb4Ref.current) {
        orb4Ref.current.style.transform = `translateY(${scrollY * -0.1}px) translateX(${scrollY * -0.1}px)`;
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <ModalProvider>
    <div className="App grid grid-cols-1 overflow-x-hidden w-full relative">
      {/* Background Pattern with Parallax */}
      <div 
        ref={svgRef}
        className="fixed inset-0 opacity-10 pointer-events-none transition-transform duration-75 ease-out"
      >
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="wavy" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
              <path
                d="M0 100 Q50 50 100 100 T200 100"
                stroke="currentColor"
                strokeWidth="1"
                fill="none"
                className="text-white/20"
              />
              <path
                d="M0 150 Q50 100 100 150 T200 150"
                stroke="currentColor"
                strokeWidth="1"
                fill="none"
                className="text-white/15"
              />
              <path
                d="M0 50 Q50 0 100 50 T200 50"
                stroke="currentColor"
                strokeWidth="1"
                fill="none"
                className="text-white/15"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#wavy)" />
        </svg>
      </div>

      {/* Ambient lighting effects with Parallax */}
      <div 
        ref={orb1Ref}
        className="fixed top-0 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none transition-transform duration-75 ease-out" 
      />
      <div 
        ref={orb2Ref}
        className="fixed bottom-0 right-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl pointer-events-none transition-transform duration-75 ease-out" 
      />
      <div 
        ref={orb3Ref}
        className="fixed top-1/2 left-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl pointer-events-none transition-transform duration-75 ease-out" 
      />
      <div 
        ref={orb4Ref}
        className="fixed top-1/4 right-0 w-80 h-80 bg-red-500/5 rounded-full blur-3xl pointer-events-none transition-transform duration-75 ease-out" 
      />

      <Header />
      <main className="pt-24">
        <div className="w-full px-6 mt-20">
          <div className="max-w-7xl mx-auto flex justify-end">
            <Breadcrumbs />
          </div>
        </div>
        <Outlet />
      </main>
      <Footer />
    </div>
    </ModalProvider>
  );
}
