import { LandingPageData } from '../../../types/landingPage';

interface HowItWorksSectionProps {
  data: LandingPageData;
}

export default function HowItWorksSection({ data }: HowItWorksSectionProps) {
  return (
    <section className="py-20 bg-white text-black">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-main font-black text-black mb-6">
            {data.howItWorks.title}
          </h2>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {data.howItWorks.steps.map((step, index) => (
            <div key={index} className="text-center">
              <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-2xl font-bold">{step.number}</span>
              </div>
              <h3 className="text-xl font-bold text-black mb-4">{step.title}</h3>
              <p className="text-zinc-700">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

