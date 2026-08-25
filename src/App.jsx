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
import ClientPortalPage from "./pages/clientPortal/ClientPortalPage";
import Gallery from "./components/Gallery";
import LegacyWorkspaceRedirect from "./components/admin/LegacyWorkspaceRedirect";
import { getLandingPageData } from "./data/landingPagesData";

const LoginPage = lazy(() => import("./pages/admin/LoginPage"));
const ResetPasswordPage = lazy(() => import("./pages/admin/ResetPasswordPage"));
const AdminPage = lazy(() => import("./pages/admin/AdminPage"));
const AdminOverview = lazy(() => import("./pages/admin/AdminOverview"));
const AdminGuard = lazy(() => import("./components/admin/AdminGuard"));
const ContentQueue = lazy(() => import("./components/admin/ContentQueue"));
const PublishedPostsPage = lazy(() => import("./pages/admin/PublishedPostsPage"));
const KeywordsPage = lazy(() => import("./pages/admin/KeywordsPage"));
const CalendarPage = lazy(() => import("./pages/admin/CalendarPage"));
const AnalyticsPage = lazy(() => import("./pages/admin/AnalyticsPage"));
const SettingsPage = lazy(() => import("./pages/admin/SettingsPage"));
const ClientsPage = lazy(() => import("./pages/admin/ClientsPage"));
const LeadsPage = lazy(() => import("./pages/admin/LeadsPage"));
const MailingListPage = lazy(() => import("./pages/admin/MailingListPage"));
const WorkspacePage = lazy(() => import("./pages/admin/WorkspacePage"));
const ChannelsPage = lazy(() => import("./pages/admin/ChannelsPage"));
const CampaignDetailPage = lazy(() => import("./pages/admin/CampaignDetailPage"));
const CampaignsPage = lazy(() => import("./pages/admin/CampaignsPage"));
const NewCampaignPage = lazy(() => import("./pages/admin/NewCampaignPage"));
const NewVariantPage = lazy(() => import("./pages/admin/NewVariantPage"));
const TasksPage = lazy(() => import("./pages/admin/TasksPage"));
const PlanningPage = lazy(() => import("./pages/admin/PlanningPage"));
const KnowledgePage = lazy(() => import("./pages/admin/KnowledgePage"));
const NewDecisionPage = lazy(() => import("./pages/admin/NewDecisionPage"));
const NewLearningPage = lazy(() => import("./pages/admin/NewLearningPage"));
const AgentRunsPage = lazy(() => import("./pages/admin/AgentRunsPage"));
const AgentProposalsPage = lazy(() => import("./pages/admin/AgentProposalsPage"));
const NewGoalPage = lazy(() => import("./pages/admin/NewGoalPage"));
const NewInitiativePage = lazy(() => import("./pages/admin/NewInitiativePage"));
const NewProjectPage = lazy(() => import("./pages/admin/NewProjectPage"));
const ProjectDetailPage = lazy(() => import("./pages/admin/ProjectDetailPage"));
const VariantDetailPage = lazy(() => import("./pages/admin/VariantDetailPage"));

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
            <Route path="/admin/reset-password" element={<Suspense fallback={null}><ResetPasswordPage /></Suspense>} />
            {/* Legacy workspace URLs remain valid while the operating system lives under /admin. */}
            <Route path="/workspace" element={<Navigate to="/admin/workspace" replace />} />
            <Route path="/workspace/campaigns" element={<Navigate to="/admin/campaigns" replace />} />
            <Route path="/workspace/campaigns/new" element={<Navigate to="/admin/campaigns/new" replace />} />
            <Route path="/workspace/campaigns/:campaignId/variants/new" element={<LegacyWorkspaceRedirect to="/admin/campaigns/:campaignId/variants/new" />} />
            <Route path="/workspace/campaigns/:campaignId" element={<LegacyWorkspaceRedirect to="/admin/campaigns/:campaignId" />} />
            <Route path="/workspace/variants/:variantId" element={<LegacyWorkspaceRedirect to="/admin/variants/:variantId" />} />
            <Route path="/workspace/tasks" element={<Navigate to="/admin/tasks" replace />} />
            <Route path="/workspace/planning/new-goal" element={<Navigate to="/admin/planning/new-goal" replace />} />
            <Route path="/workspace/planning/new-initiative" element={<Navigate to="/admin/planning/new-initiative" replace />} />
            <Route path="/workspace/planning/new-project" element={<Navigate to="/admin/planning/new-project" replace />} />
            <Route path="/workspace/planning" element={<Navigate to="/admin/planning" replace />} />
            <Route path="/workspace/projects/:projectId" element={<LegacyWorkspaceRedirect to="/admin/projects/:projectId" />} />
            <Route path="/workspace/knowledge" element={<Navigate to="/admin/knowledge" replace />} />
            <Route path="/workspace/agent-runs" element={<Navigate to="/admin/agent-runs" replace />} />
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
              <Route path="legacy-queue" element={<ContentQueue />} />
              <Route path="published" element={<PublishedPostsPage />} />
              <Route path="keywords" element={<KeywordsPage />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="clients" element={<ClientsPage />} />
              <Route path="leads" element={<LeadsPage />} />
              <Route path="mailing-list" element={<MailingListPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="workspace" element={<WorkspacePage />} />
              <Route path="channels" element={<ChannelsPage />} />
              <Route path="campaigns" element={<CampaignsPage />} />
              <Route path="campaigns/new" element={<NewCampaignPage />} />
              <Route path="campaigns/:campaignId" element={<CampaignDetailPage />} />
              <Route path="campaigns/:campaignId/variants/new" element={<NewVariantPage />} />
              <Route path="variants/:variantId" element={<VariantDetailPage />} />
              <Route path="tasks" element={<TasksPage />} />
              <Route path="planning" element={<PlanningPage />} />
              <Route path="planning/new-goal" element={<NewGoalPage />} />
              <Route path="planning/new-initiative" element={<NewInitiativePage />} />
              <Route path="planning/new-project" element={<NewProjectPage />} />
              <Route path="projects/:projectId" element={<ProjectDetailPage />} />
              <Route path="knowledge" element={<KnowledgePage />} />
              <Route path="knowledge/new-decision" element={<NewDecisionPage />} />
              <Route path="knowledge/new-learning" element={<NewLearningPage />} />
              <Route path="agent-runs" element={<AgentRunsPage />} />
              <Route path="agent-proposals" element={<AgentProposalsPage />} />
            </Route>
          </Routes>
        </Router>
      </div>
      {loading && <Loader onComplete={handleLoaderComplete} />}
    </LoaderContext.Provider>
  );
}

export default App;
