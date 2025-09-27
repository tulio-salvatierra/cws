import { useEffect } from 'react';
import { LandingPageProps } from '../../types/landingPage';
import CustomButton from '../CustomButton/CustomButton';
import { buildReviewJsonLd } from '../../lib/jsonld';
import { PHONE, EMAIL } from '../../Constants/Constants';

export default function LandingPage({ data }: LandingPageProps) {
  // Set page title and meta tags
  useEffect(() => {
    document.title = data.meta.title;
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', data.meta.description);
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = data.meta.description;
      document.head.appendChild(meta);
    }

    // Update meta keywords
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) {
      metaKeywords.setAttribute('content', data.meta.keywords.join(', '));
    } else {
      const meta = document.createElement('meta');
      meta.name = 'keywords';
      meta.content = data.meta.keywords.join(', ');
      document.head.appendChild(meta);
    }

    // Add JSON-LD structured data for reviews
    const existingJsonLd = document.querySelector('script[type="application/ld+json"]');
    if (existingJsonLd) {
      existingJsonLd.remove();
    }

    const jsonLdScript = document.createElement('script');
    jsonLdScript.type = 'application/ld+json';
    jsonLdScript.textContent = buildReviewJsonLd(data);
    document.head.appendChild(jsonLdScript);
  }, [data]);

  const scrollToContact = () => {
    const contactSection = document.getElementById('contact-form');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section - Above the Fold */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background with gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-black to-zinc-800"></div>
        
        {/* Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <div className="mb-12">
            {/* Main Headline with clear benefit + local keyword */}
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-main font-black text-white mb-6 leading-tight">
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
              onClick={scrollToContact}
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

      {/* Problem Statement Section */}
      <section className="py-20 bg-white text-black">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-main font-black text-black mb-6">
              {data.problemStatement.title}
            </h2>
            <p className="text-xl text-zinc-700 max-w-3xl mx-auto leading-relaxed">
              {data.problemStatement.description}
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

      {/* Solution Section */}
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
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 bg-black text-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-main font-black text-orange-500 mb-8">
              Trusted by Local Businesses
            </h2>
            
            {/* Client Logos */}
            <div className="flex flex-wrap justify-center items-center gap-8 mb-12">
              {data.trustSection.clients.map((client, index) => (
                <div key={index} className="text-zinc-400 text-lg font-medium">
                  {client}
                </div>
              ))}
            </div>
            
            {/* Testimonial */}
            <div className="max-w-3xl mx-auto">
              <blockquote className="text-xl text-zinc-300 italic mb-6">
                "{data.trustSection.testimonial.text}"
              </blockquote>
              <div className="text-orange-500 font-semibold">
                {data.trustSection.testimonial.author}
              </div>
              <div className="text-zinc-400 text-sm">
                {data.trustSection.testimonial.business}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
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

      {/* Local Hook Section */}
      <section className="py-20 bg-zinc-50">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-main font-black text-black mb-6">
            {data.localHook.title}
          </h2>
          <p className="text-xl text-zinc-700 mb-8 leading-relaxed">
            {data.localHook.description}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {data.localHook.areas.map((area, index) => (
              <span key={index} className="bg-orange-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                {area}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact-form" className="py-20 bg-zinc-900">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-main font-black text-orange-500 mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-zinc-300">
              Contact us today for a free consultation and quote
            </p>
          </div>
          <div className="bg-zinc-800 rounded-2xl p-8 md:p-12">
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a 
                href={`tel:+1${PHONE}`} 
                className="btn-bounce group w-full sm:w-auto"
              >
                <div className="btn-bounce-bg"></div>
                <div className="btn-bounce-text__wrap">
                  <span className="btn-bounce-text">📞 Call ({PHONE.toString().slice(0,3)}) {PHONE.toString().slice(3,6)}-{PHONE.toString().slice(6)}</span>
                </div>
              </a>
              <a 
                href={`mailto:${EMAIL}`} 
                className="btn-bounce group w-full sm:w-auto"
              >
                <div className="btn-bounce-bg"></div>
                <div className="btn-bounce-text__wrap">
                  <span className="btn-bounce-text">✉️ Email Us</span>
                </div>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
