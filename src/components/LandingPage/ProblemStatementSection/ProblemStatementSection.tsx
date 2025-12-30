import { Link } from 'react-router-dom';
import { LandingPageData } from '../../../types/landingPage';

interface ProblemStatementSectionProps {
  data: LandingPageData;
}

export default function ProblemStatementSection({ data }: ProblemStatementSectionProps) {
  return (
    <section className="py-20 bg-white text-black">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-main font-black text-black mb-6">
            {data.problemStatement.title}
          </h2>
          <p className="text-xl text-zinc-700 max-w-3xl mx-auto leading-relaxed">
            {data.problemStatement.description} Learn more about our <Link to="/services" className="text-orange-500 hover:text-orange-600 underline">web design services</Link> and <Link to="/about" className="text-orange-500 hover:text-orange-600 underline">how we work</Link> to help improve your online presence.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {data.problemStatement.painPoints.map((point, index) => (
            <div key={index} className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-red-600">⚠️</span>
              </div>
              <p className="text-lg text-zinc-700 font-medium">{point}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

