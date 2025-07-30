import CustomButton from "../CustomButton";

export default function Footer() {
  return (
    <footer className="bg-transparent text-gray-200 py-12 px-4 md:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Top Section: Navigation and Back to Top */}
        <div className="flex flex-col sm:flex-row justify-between items-center pb-8">
          <nav className="flex space-x-6 text-sm font-medium uppercase tracking-wider mb-4 sm:mb-0">
            <a href="#" className="hover:text-white transition-colors">
              Home
            </a>
            <a href="#about" className="hover:text-white transition-colors">
              About
            </a>
            <a href="#portfolio" className="hover:text-white transition-colors">
              Portfolio
            </a>
            <a href="#contact" className="hover:text-white transition-colors">
              Contact
            </a>
          </nav>
          <CustomButton label="Back to Top" href="#" secondary={true} />
        </div>

        {/* Dotted Line Separator */}
        <div className="border-t border-dashed border-gray-700 my-8"></div>

        {/* Middle Section: Large FOCAL text */}
        <div className="flex items-end justify-center sm:justify-start py-16">
          <h1 className="text-[6rem] leading-none font-extrabold text-gray-100 sm:text-[10rem] md:text-[12rem] lg:text-[15rem]">
            CWS
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
              href="#"
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
