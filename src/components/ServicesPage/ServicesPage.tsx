import { useFadeIn } from '@/Hooks/useFadeIn';
import ServicesHeader from './ServicesHeader';
import ServiceCard from './ServiceCard';
import ProcessSection from './ProcessSection';
import WhyChooseUsSection from './WhyChooseUsSection';
import CTASection from './CTASection';
import { servicesData } from './servicesData';

export default function ServicesPage() {
  const fadeInRef = useFadeIn();

  return (
    <section className="relative w-full min-h-screen bg-zinc-900/10 py-20 px-4 mt-20">
      <div ref={fadeInRef} className="max-w-7xl mx-auto">
        <ServicesHeader />
        
        {/* Location Reinforcement */}
        <div className="text-center mb-12">
          <h2 className="text-xl font-main font-semibold text-orange-500 mb-4">
            Professional Web Design Services in Chicago
          </h2>
          <p className="text-zinc-300 max-w-3xl mx-auto">
            Serving small businesses across Chicago, Cicero, and surrounding Chicagoland areas with professional web design services, website redesign, and conversion-focused solutions. Explore our location-specific services: <a href="/landing/cicero-web-design" className="text-orange-500 hover:text-orange-400 underline">Cicero web design</a>, <a href="/landing/oak-park-seo" className="text-orange-500 hover:text-orange-400 underline">Oak Park SEO</a>, and <a href="/landing/elmwood-park-maintenance" className="text-orange-500 hover:text-orange-400 underline">Elmwood Park website maintenance</a>.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid items-center justify-center gap-8 mb-16">
          {servicesData.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>

        {/* Social Proof Section */}
        <div className="bg-zinc-800/30 rounded-2xl p-8 mb-16 text-center">
          <h2 className="text-3xl font-main font-bold text-orange-500 mb-6">
            Real Results for Chicago Businesses
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="bg-zinc-900/50 rounded-xl p-6">
              <p className="text-4xl font-bold text-orange-500 mb-2">40%</p>
              <p className="text-zinc-300">
                Increase in bookings for a local spa after our website redesign—achieved in just three months.
              </p>
            </div>
            <div className="bg-zinc-900/50 rounded-xl p-6">
              <p className="text-4xl font-bold text-orange-500 mb-2">2.5x</p>
              <p className="text-zinc-300">
                More phone calls and online enquiries for a Cicero restaurant after implementing our local SEO strategy.
              </p>
            </div>
          </div>
        </div>

        <ProcessSection />

        <WhyChooseUsSection />

        <CTASection />
      </div>
    </section>
  );
}
