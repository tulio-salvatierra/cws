import "./App.css";
import Footer from "./components/Footer/Footer";
import Header from "./components/Header/Header";
import Problem from "./components/Problem";
import Hero from "./components/Hero";
import Services from "./components/Services";
import WhoAreWe from "./components/WhoAreWe";
import { useEffect } from "react";
import Lenis from "lenis";

function App() {
  useEffect(() => {
    const lenis = new Lenis();
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }, []);
  return (
    <div className="App grid grid-cols-1">
      <div>
        <Header />
        <Hero />
      </div>

      <div>
        <Problem />
      </div>

      <div>
        <Services />
      </div>

      <div>
        <WhoAreWe />
      </div>

      <div>
        <Footer />
      </div>
    </div>
  );
}

export default App;
