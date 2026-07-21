import { LandingPageData } from '../../../types/landingPage';

interface TrustSectionProps {
  data: LandingPageData;
}

export default function TrustSection({ data }: TrustSectionProps) {
  return (
    <section className="py-20 ">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-main font-black text-orange-500 mb-8">
            Trusted by Local Businesses
          </h2>
          
          {/* Client Logos */}
          <div className="flex flex-wrap justify-center items-center gap-8 mb-12">
            {data.trustSection.clients.map((client, index) => (
              <div key={index} className="text-orange-500 text-lg font-medium">
                {client}
              </div>
            ))}
          </div>
          
          {/* Testimonial */}
          <div className="max-w-3xl mx-auto">
            <blockquote className="text-xl text-orange-500 italic mb-6">
              "{data.trustSection.testimonial.text}"
            </blockquote>
            <div className="text-orange-500 font-semibold">
              {data.trustSection.testimonial.author}
            </div>
            <div className="text-orange-500 text-sm">
              {data.trustSection.testimonial.business}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

