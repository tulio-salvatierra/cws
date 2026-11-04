import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, useLayoutEffect } from 'react';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import AppBackground from './AppBackground';
import { generateOrganizationSchema, addJsonLd, updateCanonicalUrl, applyRouteMeta } from '../../lib/seo';
import routeMeta from '../../data/route-meta.json';
import './Layout.css';

export default function Layout() {
  const { pathname } = useLocation();
  useLayoutEffect(() => {
    updateCanonicalUrl();
    applyRouteMeta(routeMeta, pathname);
  }, [pathname]);

  // Lead tracking: one delegated listener pushes a GTM event for every
  // tap-to-call / email link, so contact clicks are measurable per page.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest?.('a[href^="tel:"], a[href^="mailto:"]');
      if (!link) return;
      const href = link.getAttribute('href') || '';
      const w = window as unknown as { dataLayer?: unknown[] };
      w.dataLayer = w.dataLayer || [];
      w.dataLayer.push({
        event: 'lead_click',
        booking_method: href.startsWith('tel:') ? 'phone' : 'email',
        booking_source: `page:${window.location.pathname}`,
      });
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  useEffect(() => {
    const orgSchema = generateOrganizationSchema();
    addJsonLd(orgSchema, 'organization');

    return () => {
      const existing = document.querySelector('script[data-jsonld-id="organization"]');
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
