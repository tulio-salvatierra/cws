import "./App.css";
import Footer from "./components/Footer/Footer";
import Header from "./components/Header/Header";
import Problem from "./components/Problem";
import Hero from "./components/Hero";
import Services from "./components/Services";
import WhoAreWe from "./components/WhoAreWe";
import Projects from "./components/Projects/Projects";
import { useEffect, useState } from "react";
import Loader from "./components/Loader";
import { useLenis } from "./Hooks/lenis";

function App() {
  useLenis(); // Custom hook for smooth scrolling

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000); // Adjust the time as needed

    return () => {
      clearTimeout(timer);
    };
  }, []);

  return (
    <>
      <div className="App grid grid-cols-1">
        <div>
          <Header />
          <Hero />
        </div>
        <div>
          <Problem />
        </div>
        <div className="h-auto">
          <Services />
        </div>
        <div className="h-auto">
          <Projects />
        </div>
        
        <div>
          <WhoAreWe />
        </div>
        <div>
          <Footer />
        </div>
      </div>

      {loading && (
        <div className="App grid grid-cols-1">
          <Loader />
        </div>
      )}
    </>
  );
}

export default App;
