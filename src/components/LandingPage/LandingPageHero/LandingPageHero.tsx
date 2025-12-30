import { LandingPageData } from '../../../types/landingPage';
import heroVideo from '../../../assets/video/hero.mp4';

interface LandingPageHeroProps {
  data: LandingPageData;
  onCTAClick: () => void;
}

export default function LandingPageHero({ data, onCTAClick }: LandingPageHeroProps) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Video Background */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover -z-10"
      >
        <source src={heroVideo} type="video/mp4" />
      </video>
      
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-black/60"></div>
      
      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        <div className="mb-12">
          {/* Main Headline with clear benefit + local keyword */}
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-main font-black text-orange-500 mb-6 leading-tight">
            {data.headline}
          </h1>
          
          {/* Subtext - 1-2 sentences on value */}
          <p className="text-lg md:text-xl text-zinc-300 max-w-3xl mx-auto leading-relaxed mb-8">
            {data.subtext}
          </p>
        </div>
        
        {/* CTA Button - scrolls to contact form */}
        <div className="flex flex-col items-center gap-6">
          <button
            onClick={onCTAClick}
            className="btn-bounce group"
          >
            <div className="btn-bounce-bg"></div>
            <div className="btn-bounce-text__wrap">
              <span className="btn-bounce-text">{data.ctaText}</span>
            </div>
          </button>
          
          {/* Service type and location indicator */}
          <div className="text-sm text-zinc-400 flex items-center gap-2">
            <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
            <span className="text-orange-500 font-semibold">{data.serviceType}</span>
            <span>for {data.location}</span>
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-orange-500/10 rounded-full blur-xl"></div>
      <div className="absolute bottom-20 right-10 w-48 h-48 bg-orange-500/5 rounded-full blur-2xl"></div>
      <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-orange-500/5 rounded-full blur-lg"></div>
    </section>
  );
}

