import { useState } from "react";
import { MENU_ITEM } from "../../Constants/Constants";
import Burger from "../../assets/icons/burger.svg";

export default function Header() {
  const [showMenu, setShowMenu] = useState(false);
  const toggleMenu = () => setShowMenu(!showMenu);

  return (
    <div className="flex p-3 w-screen content-center sticky top-0 bg-transparent z-50">
      <div className="flex w-screen p-6 justify-between items-center">
        {/* Desktion Header */}
        <h1 className="text-orange-500 text-6xl md:text-8xl font-bold tracking-tight">
          CICERO WEB STUDIO <sup className="text-2xl align-super">®</sup>
        </h1>
        <div className="space-x-8 hidden font-secondary items-start md:flex text-xs tracking-tight">
          {MENU_ITEM.map((nav, index) => (
            <a
              href={nav.url}
              key={index}
              className={nav.class}
              onClick={toggleMenu}
            >
              {nav.name}
            </a>
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
