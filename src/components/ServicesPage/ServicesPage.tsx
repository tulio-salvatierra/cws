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

        {/* Services Grid */}
        <div className="grid items-center justify-center gap-8 mb-16">
          {servicesData.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>

        <ProcessSection />

        <WhyChooseUsSection />

        <CTASection />
      </div>
    </section>
  );
}
