import "./App.css";
import { BrowserRouter as Router, Navigate, Routes, Route, useParams } from "react-router-dom";
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
import Gallery from "./components/Gallery";
import { getLandingPageData } from "./data/landingPagesData";

const LoginPage = lazy(() => import("./pages/admin/LoginPage"));
const ResetPasswordPage = lazy(() => import("./pages/admin/ResetPasswordPage"));
const AdminPage = lazy(() => import("./pages/admin/AdminPage"));
const AdminOverview = lazy(() => import("./pages/admin/AdminOverview"));
const AdminGuard = lazy(() => import("./components/admin/AdminGuard"));
const ClientsPage = lazy(() => import("./pages/admin/ClientsPage"));
const LeadsPage = lazy(() => import("./pages/admin/LeadsPage"));
const SalesPage = lazy(() => import("./pages/admin/SalesPage"));
const MarketingPage = lazy(() => import("./pages/admin/MarketingPage"));
const OperationsPage = lazy(() => import("./pages/admin/OperationsPage"));
const OperationsProjectPage = lazy(() => import("./pages/admin/OperationsProjectPage"));
const AccountingPage = lazy(() => import("./pages/admin/AccountingPage"));
const CompliancePage = lazy(() => import("./pages/admin/CompliancePage"));

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
              <Route path="client-portal" element={<Navigate to="/" replace />} />
              {/* Dynamic landing page routes inside layout so providers apply */}
              <Route path="landing/:id" element={<LandingPageWrapper />} />
            </Route>
            <Route path="/admin/login" element={
              <Suspense fallback={null}>
                <LoginPage />
              </Suspense>
            } />
            <Route path="/admin/reset-password" element={<Suspense fallback={null}><ResetPasswordPage /></Suspense>} />
            {/* Retired generic workspace screens stay harmless for saved links. */}
            <Route path="/workspace/*" element={<Navigate to="/admin" replace />} />
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
              <Route index element={<AdminOverview />} />
              <Route path="legacy-queue" element={<Navigate to="/admin/marketing" replace />} />
              <Route path="published" element={<Navigate to="/admin/marketing" replace />} />
              <Route path="keywords" element={<Navigate to="/admin" replace />} />
              <Route path="calendar" element={<Navigate to="/admin/marketing" replace />} />
              <Route path="analytics" element={<Navigate to="/admin/marketing" replace />} />
              <Route path="clients" element={<ClientsPage />} />
              <Route path="leads" element={<LeadsPage />} />
              <Route path="sales" element={<SalesPage />} />
              <Route path="mailing-list" element={<Navigate to="/admin" replace />} />
              <Route path="settings" element={<Navigate to="/admin" replace />} />
              <Route path="workspace/*" element={<Navigate to="/admin" replace />} />
              <Route path="channels/*" element={<Navigate to="/admin" replace />} />
              <Route path="campaigns/*" element={<Navigate to="/admin" replace />} />
              <Route path="variants/*" element={<Navigate to="/admin" replace />} />
              <Route path="tasks/*" element={<Navigate to="/admin" replace />} />
              <Route path="planning/*" element={<Navigate to="/admin" replace />} />
              <Route path="projects/*" element={<Navigate to="/admin" replace />} />
              <Route path="knowledge/*" element={<Navigate to="/admin" replace />} />
            <Route path="agent-runs/*" element={<Navigate to="/admin/marketing#laya-assessments" replace />} />
              <Route path="marketing" element={<MarketingPage />} />
              <Route path="operations" element={<OperationsPage />} />
              <Route path="operations/:projectId" element={<OperationsProjectPage />} />
              <Route path="accounting" element={<AccountingPage />} />
              <Route path="compliance" element={<CompliancePage />} />
            </Route>
          </Routes>
        </Router>
      </div>
      {loading && <Loader onComplete={handleLoaderComplete} />}
    </LoaderContext.Provider>
  );
}

export default App;
