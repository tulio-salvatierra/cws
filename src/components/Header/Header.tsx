import { useState } from "react";
import { MENU_ITEM } from "../../Constants/Constants";

export default function Header() {
  const [showMenu, setShowMenu] = useState(false);
  const toggleMenu = () => setShowMenu(!showMenu);

  return (
    <div className="justify-between text-orange-700 w-screen content-center sticky top-0 flex z-50">

      <p className="font-extrabold text-2xl p-4 w-25 self-center">
        [CWS]
      </p>

      <div className="flex w-auto ml-auto justify-end">
        {/* Desktop Menu */}
        <nav className="hidden md:flex p-4 text-right justify-end items-center">
          {MENU_ITEM.map((nav, index) => (
            <a href={nav.url} key={index} className={nav.class}>
              {nav.name}
            </a>
          ))}
          <a
            href="tel:+17739199161"
            className="p-4 rounded-full text-white border-2 font-main font-bold text-lg  justify-self-end self-center ml-10 mx-20 transition ease-in-out delay-50 hover:-translate-y-1 hover:scale-100 hover:bg-indigo-100 duration-100"
          >
            Book now!
          </a>
        </nav>

        {/* Mobile Menu Button */}
        <button className="md:hidden" onClick={toggleMenu}>
          <img  className="p-6 hover:" alt="Menu" />
        </button>
      </div>

      {/* Mobile Menu */}
      {showMenu && (
        <nav
          className="md:hidden fixed top-0 left-0 w-full h-full z-50 flex flex-col items-center p-4 justify-between"
         
        >
          <div className="content-top text-left gap-3">
            <a
              className="p-4 rounded-full text-lg  mb-4 transition ease-in-out delay-150 hover:-translate-y-1 hover:scale-110 hover:bg-indigo-400 duration-300 tracking-tighter"
              href="tel:+17739199161"
            >
              Book now!
            </a>
            <nav className=" xs:flex sm:flex p-4 text-right justify-end items-center">
              {MENU_ITEM.map((navMobile, index) => (
                <a
                  href={navMobile.url}
                  key={index}
                  className={navMobile.class}
                  onClick={toggleMenu}
                >
                  {navMobile.name}
                </a>
              ))}
            </nav>
            <button
              className="text-mainBlue text-xl  mt-4"
              onClick={toggleMenu}
            >
              Close X
            </button>
          </div>
          <footer className="content-end">
            <div
              className="flex flex-col items-start gap-4"
              onClick={toggleMenu}
            >
              <a href="#" className="flex items-center gap-2">
                CSW
              </a>
              <p className="text-muted-foreground text-left max-w-md font-second">
              Our mission is to deliver tailored websites and software solutions that
              solve real problems and drive meaningful growth.
              </p>
            </div>
          </footer>
        </nav>
      )}
    </div>
  );
}