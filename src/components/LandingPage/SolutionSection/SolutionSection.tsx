import { Link } from 'react-router-dom';
import { LandingPageData } from '../../../types/landingPage';

interface SolutionSectionProps {
  data: LandingPageData;
}

export default function SolutionSection({ data }: SolutionSectionProps) {
  return (
    <section className="py-20 bg-zinc-50">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-main font-black text-black mb-6">
            {data.solution.title}
          </h2>
          <div className="text-2xl font-bold text-orange-500 mb-8">
            Starting at {data.solution.startingPrice}
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          {data.solution.features.map((feature, index) => (
            <div key={index} className="flex items-start gap-4">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-white text-sm font-bold">✓</span>
              </div>
              <p className="text-lg text-zinc-700">{feature}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <p className="text-zinc-600">
            Want to learn more about our approach? <Link to="/about" className="text-orange-500 hover:text-orange-600 underline">See how we work</Link> and what makes our strategies effective. Ready to get started? <Link to="/contact" className="text-orange-500 hover:text-orange-600 underline">Contact us</Link> for a free consultation.
          </p>
        </div>
      </div>
    </section>
  );
}

