import { LandingPageData } from '../../../types/landingPage';
import { EMAIL, PHONE } from '../../../Constants/Constants';

interface LandingPageContactFormProps {
  data: LandingPageData;
}

export default function LandingPageContactForm({ data }: LandingPageContactFormProps) {
  return (
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
          <form className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-zinc-300 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="w-full px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="w-full px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="your@email.com"
                />
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-zinc-300 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  className="w-full px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <label htmlFor="business" className="block text-sm font-medium text-zinc-300 mb-2">
                  Business Type
                </label>
                <select
                  id="business"
                  name="business"
                  className="w-full px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Select your business type</option>
                  <option value="restaurant">Restaurant</option>
                  <option value="retail">Retail Store</option>
                  <option value="service">Service Business</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="professional">Professional Services</option>
                  <option value="nonprofit">Non-profit</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            
            <div>
              <label htmlFor="service" className="block text-sm font-medium text-zinc-300 mb-2">
                Service Interested In *
              </label>
              <select
                id="service"
                name="service"
                required
                className="w-full px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">Select a service</option>
                <option value="web-design">Web Design & Development</option>
                <option value="digital-marketing">Digital Marketing</option>
                <option value="ecommerce">E-commerce Website</option>
                <option value="seo">SEO Services</option>
                <option value="maintenance">Website Maintenance</option>
                <option value="consultation">Free Consultation</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-zinc-300 mb-2">
                Project Details
              </label>
              <textarea
                id="message"
                name="message"
                rows={4}
                className="w-full px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-vertical"
                placeholder="Tell us about your project, goals, and timeline..."
              ></textarea>
            </div>
            
            <div className="text-center">
              <button
                type="submit"
                className="btn-bounce"
              >
                <div className="btn-bounce-bg"></div>
                <div className="btn-bounce-text__wrap">
                  <span className="btn-bounce-text">{data.ctaText}</span>
                </div>
              </button>
            </div>
            
            {/* Direct Contact Info */}
            <div className="text-center pt-6 border-t border-zinc-700">
              <p className="text-zinc-400 mb-4">Or contact us directly:</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <a 
                  href={`tel:+1${PHONE}`} 
                  className="text-orange-500 hover:text-orange-400 font-medium flex items-center gap-2"
                >
                  📞 +1 {String(PHONE).replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3')}
                </a>
                <a 
                  href={`mailto:${EMAIL}`} 
                  className="text-orange-500 hover:text-orange-400 font-medium flex items-center gap-2"
                >
                  {EMAIL}
                </a>
              </div>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

