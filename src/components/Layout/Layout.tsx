import { Outlet } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import Header from '../Header/Header';
import Breadcrumbs from '../Breadcrumbs';
import { ModalProvider } from '../LeadFormModal/ModalContext';
import Footer from '../Footer/Footer';

export default function Layout() {
 

 

  return (
    <ModalProvider>
    <div className="App grid grid-cols-1 overflow-x-hidden w-full relative">
      {/* Background Pattern with Parallax */}
      <div 
 
        className="fixed inset-0 opacity-10 pointer-events-none transition-transform duration-75 ease-out z-0"
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
 
        className="fixed top-0 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none transition-transform duration-75 ease-out z-0" 
      />
      <div 
 
        className="fixed bottom-0 right-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl pointer-events-none transition-transform duration-75 ease-out z-0" 
      />
      <div 
 
        className="fixed top-1/2 left-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl pointer-events-none transition-transform duration-75 ease-out z-0" 
      />
      <div 
 
        className="fixed top-1/4 right-0 w-80 h-80 bg-red-500/5 rounded-full blur-3xl pointer-events-none transition-transform duration-75 ease-out z-0" 
      />

      <Header />
      <main className="">
        
        <Outlet />
      </main>
      <Footer />
    </div>
    </ModalProvider>
  );
}
