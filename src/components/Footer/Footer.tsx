import CustomButton from "../CustomButton";
import { useLenis } from "../../Hooks/lenis";
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { MENU_ITEM } from "../../Constants/Constants";

export default function Footer() {
  const lenisRef = useRef<any>(null);
  
  // Get the Lenis instance
  useLenis();
  
  useEffect(() => {
    // Get the Lenis instance from the window object
    if (typeof window !== 'undefined') {
      lenisRef.current = (window as any).lenis;
    }
  }, []);
  
  const scrollToTop = () => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { duration: 2 });
    } else {
      // Fallback to regular smooth scroll if Lenis is not available
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  return (
    <footer className="bg-transparent text-gray-200 py-12 px-4">
      <div className="mx-auto">
        {/* Top Section: Navigation and Back to Top */}
        <div className="flex flex-col sm:flex-row justify-between items-center pb-8">
          <nav className="flex space-x-6 text-sm font-medium uppercase tracking-wider mb-4 sm:mb-0">
            <Link to="/" className="hover:text-white transition-colors">
              Home
            </Link>
            {MENU_ITEM.map((nav, index) => (
              <Link
                key={index}
                to={nav.url}
                className="hover:text-white transition-colors"
              >
                {nav.name}
              </Link>
            ))}
          </nav>
          <CustomButton label="Back to Top" onClick={scrollToTop} secondary={true} />
        </div>

        {/* Dotted Line Separator */}
        <div className="border-t border-dashed border-gray-700 my-8"></div>

        {/* Middle Section: Large FOCAL text */}
        <div className="flex items-end justify-center sm:justify-start py-16">
          <h1 className="text-[5rem] leading-none font-extrabold text-orange-500 sm:text-[3.2rem] md:text-[5rem] lg:text-[10rem]">
            CICERO WEB STUDIO
          </h1>
          <span className="text-gray-500 text-4xl font-bold ml-4 mb-8 sm:mb-12 md:mb-16 lg:mb-20 border border-gray-500 rounded-full p-2">
            &reg;
          </span>
        </div>

        {/* Bottom Section: Copyright and Design Credits */}
        <div className="flex flex-col sm:flex-row justify-between items-center pt-8 text-xs text-gray-400">
          <p className="mb-2 sm:mb-0">
            &copy; {new Date().getFullYear()} CICERO WEB STUDIO{" "}
          </p>
          <p>
            DEVELOPMENT & DESIGN BY{" "}
            <a
              href="https://www.tuliosalvatierra.com"
              className="underline hover:text-white transition-colors"
            >
              Tulio Salvatierra
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
