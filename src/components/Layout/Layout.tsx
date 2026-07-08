import { Outlet } from "react-router-dom";
import { useEffect } from "react";
import Header from "../Header/Header";
import Footer from "../Footer/Footer";
import AppBackground from "./AppBackground";
import { generateOrganizationSchema, addJsonLd } from "../../lib/seo";
import "./Layout.css";

export default function Layout() {
  useEffect(() => {
    const orgSchema = generateOrganizationSchema();
    addJsonLd(orgSchema, "organization");

    return () => {
      const existing = document.querySelector(
        'script[data-jsonld-id="organization"]',
      );
      if (existing) {
        existing.remove();
      }
    };
  }, []);

  return (
    <div className="App grid grid-cols-1 w-full relative min-h-screen overflow-x-hidden">
      <div className="app-background" aria-hidden>
        <AppBackground />
      </div>
      <Header />
      <main className="relative z-10 min-h-screen bg-transparent pt-0">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
