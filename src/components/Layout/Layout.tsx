import { Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { MeshGradient } from '@paper-design/shaders-react';
import Header from '../Header/Header';
import { ModalProvider } from '../LeadFormModal/ModalContext';
import Footer from '../Footer/Footer';
import { generateOrganizationSchema, addJsonLd } from '../../lib/seo';

export default function Layout() {
  const [size, setSize] = useState({ width: 1280, height: 720 });

  useEffect(() => {
    const updateSize = () =>
      setSize({ width: window.innerWidth, height: window.innerHeight });
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Add Organization schema to all pages
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
    <ModalProvider>
    <div className="App grid grid-cols-1 w-full relative min-h-screen overflow-x-hidden">
      {/* Single app background: MeshGradient covers the whole app; transparent sections let it show through for a layered effect */}
      <div
        className="app-background fixed inset-0 pointer-events-none z-0 overflow-hidden"
        style={{ minWidth: '100vw', minHeight: '100vh', width: '100vw', height: '100vh' }}
        aria-hidden
      >
        <MeshGradient
          width={size.width}
          height={size.height}
          colors={['#fa9638e3', '#00000040', '#f5f4f4']}
          distortion={1}
          swirl={1}
          grainMixer={0}
          grainOverlay={0.23}
          speed={0.48}
          scale={1.32}
          rotation={132}
          offsetX={0.04}
        />
      </div>
      <Header />
      <main className="relative z-10 min-h-screen bg-transparent pt-0">
        <Outlet />
      </main>
      <Footer />
    </div>
    </ModalProvider>
  );
}
