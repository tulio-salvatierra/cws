import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import Loader from "./components/Loader";
import {
  LoaderContext,
  HERO_ANIMATION_DELAY_MS,
} from "./context/LoaderContext";
import { useLenis } from "./Hooks/lenis";
import Layout from "./components/Layout/Layout";
import Home from "./components/Home/Home";
import Gallery from "./components/Gallery";

function App() {
  useLenis();

  const [loading, setLoading] = useState(true);
  const [heroReady, setHeroReady] = useState(false);
  const heroDelayTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (heroDelayTimerRef.current) {
        clearTimeout(heroDelayTimerRef.current);
      }
    };
  }, []);

  const handleLoaderComplete = useCallback(() => {
    setLoading(false);
    heroDelayTimerRef.current = window.setTimeout(() => {
      setHeroReady(true);
    }, HERO_ANIMATION_DELAY_MS);
  }, []);

  return (
    <LoaderContext.Provider value={{ heroReady }}>
      <div className={`app-shell ${loading ? "app-shell--loading" : ""}`}>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="gallery" element={<Gallery />} />
            </Route>
          </Routes>
        </Router>
      </div>
      {loading && <Loader onComplete={handleLoaderComplete} />}
    </LoaderContext.Provider>
  );
}

export default App;
