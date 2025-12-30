import { Link } from 'react-router-dom';
import { LandingPageData } from '../../../types/landingPage';

interface LocalHookSectionProps {
  data: LandingPageData;
}

export default function LocalHookSection({ data }: LocalHookSectionProps) {
  return (
    <section className="py-20 bg-zinc-50">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-main font-black text-black mb-6">
          {data.localHook.title}
        </h2>
        <p className="text-xl text-zinc-700 mb-8 leading-relaxed">
          {data.localHook.description} Explore our <Link to="/services" className="text-orange-500 hover:text-orange-600 underline">full range of services</Link> for Chicago businesses.
        </p>
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {data.localHook.areas.map((area, index) => (
            <span key={index} className="bg-orange-500 text-white px-4 py-2 rounded-full text-sm font-medium">
              {area}
            </span>
          ))}
        </div>
        <div className="text-center">
          <p className="text-zinc-600 mb-4">
            Ready to get started? <Link to="/contact" className="text-orange-500 hover:text-orange-600 underline">Contact us</Link> for a free consultation on your digital marketing needs.
          </p>
          <p className="text-zinc-600">
            Learn more about digital marketing strategies on our <Link to="/blog" className="text-orange-500 hover:text-orange-600 underline">blog</Link>, where we share insights on SEO, PPC, social media marketing, and content marketing.
          </p>
        </div>
      </div>
    </section>
  );
}

