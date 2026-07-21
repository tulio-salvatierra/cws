import "./App.css";
import { BrowserRouter as Router, Routes, Route, useParams } from "react-router-dom";
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import Loader from "./components/Loader";
import {
  LoaderContext,
  HERO_ANIMATION_DELAY_MS,
} from "./context/LoaderContext";
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
import ClientPortalPage from "./pages/clientPortal/ClientPortalPage";
import Gallery from "./components/Gallery";
import { getLandingPageData } from "./data/landingPagesData";

const LoginPage = lazy(() => import("./pages/admin/LoginPage"));
const AdminPage = lazy(() => import("./pages/admin/AdminPage"));
const AdminGuard = lazy(() => import("./components/admin/AdminGuard"));
const ContentQueue = lazy(() => import("./components/admin/ContentQueue"));
const KeywordsPage = lazy(() => import("./pages/admin/KeywordsPage"));
const CalendarPage = lazy(() => import("./pages/admin/CalendarPage"));
const AnalyticsPage = lazy(() => import("./pages/admin/AnalyticsPage"));
const SettingsPage = lazy(() => import("./pages/admin/SettingsPage"));
const ClientsPage = lazy(() => import("./pages/admin/ClientsPage"));

// Wrapper component for dynamic landing pages
function LandingPageWrapper() {
  const { id } = useParams();
  const landingPageData = getLandingPageData(id);

  if (!landingPageData) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center">
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
              <Route path="services" element={<ServicesPage />} />
              <Route path="about" element={<About />} />
              <Route path="policy" element={<Policy />} />
              <Route path="blog" element={<Blog />} />
              <Route path="blog/:slug" element={<BlogPost />} />
              <Route path="contact" element={<Contact />} />
              <Route path="gallery" element={<Gallery />} />
              <Route path="client-portal" element={<ClientPortalPage />} />
              {/* Dynamic landing page routes inside layout so providers apply */}
              <Route path="landing/:id" element={<LandingPageWrapper />} />
            </Route>
            <Route path="/admin/login" element={
              <Suspense fallback={null}>
                <LoginPage />
              </Suspense>
            } />
            <Route
              path="/admin"
              element={
                <Suspense fallback={null}>
                  <AdminGuard>
                    <AdminPage />
                  </AdminGuard>
                </Suspense>
              }
            >
              <Route index element={<ContentQueue />} />
              <Route path="keywords" element={<KeywordsPage />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="clients" element={<ClientsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </Router>
      </div>
      {loading && <Loader onComplete={handleLoaderComplete} />}
    </LoaderContext.Provider>
  );
}

export default App;
