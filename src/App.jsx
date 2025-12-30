import "./App.css";
import { BrowserRouter as Router, Routes, Route, useParams } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import Loader from "./components/Loader";
import { useLenis } from "./Hooks/lenis";
import Layout from "./components/Layout/Layout";
import Home from "./components/Home/Home";
import About from "./components/About";
import Policy from "./components/Policy";
import ServicesPage from "./components/ServicesPage";
import Blog from "./components/Blog";
import BlogPost from "./components/BlogPost";
import Contact from "./components/Contact";
import LandingPage from "./components/LandingPage";
import { getLandingPageData } from "./data/landingPagesData";

// Wrapper component for dynamic landing pages
function LandingPageWrapper() {
  const { id } = useParams();
  const landingPageData = getLandingPageData(id);

  if (!landingPageData) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-main font-black text-orange-500 mb-4">
            Page Not Found
          </h1>
          <p className="text-xl text-zinc-300 mb-8">
            The landing page you&apos;re looking for doesn&apos;t exist.
          </p>
          <a 
            href="/" 
            className="btn-bounce"
          >
            <div className="btn-bounce-bg"></div>
            <div className="btn-bounce-text__wrap">
              <span className="btn-bounce-text">Go Home</span>
            </div>
          </a>
        </div>
      </div>
    );
  }

  return <LandingPage data={landingPageData} />;
}

function App() {
  useLenis(); // Custom hook for smooth scrolling

  // Show loader only once per session
  const [loading, setLoading] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("hasLoaded") !== "true";
    }
    return true;
  });
  const [appVisible, setAppVisible] = useState(false);

  useEffect(() => {
    if (!loading) {
      const revealTimer = setTimeout(() => setAppVisible(true), 150);
      return () => clearTimeout(revealTimer);
    }
    setAppVisible(false);
  }, [loading]);

  const handleLoaderComplete = useCallback(() => {
    setLoading(false);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("hasLoaded", "true");
    }
  }, []);

  return (
    <div className={`app-shell ${appVisible ? "app-shell--visible" : "app-shell--hidden"}`}>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="services" element={<ServicesPage />} />
            <Route path="about" element={<About />} />
            <Route path="policy" element={<Policy />} />
            <Route path="blog" element={<Blog />} />
            <Route path="blog/:slug" element={<BlogPost />} />
            <Route path="contact" element={<Contact />} />
            {/* Dynamic landing page routes inside layout so providers apply */}
            <Route 
              path="landing/:id" 
              element={<LandingPageWrapper />} 
            />
          </Route>
        </Routes>
      </Router>
      {loading && <Loader onComplete={handleLoaderComplete} />}
    </div>
  );
}

export default App;
