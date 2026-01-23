interface CTASectionProps {
  title?: string;
  description?: string;
  primaryButtonText?: string;
  primaryButtonHref?: string;
  secondaryButtonText?: string;
  secondaryButtonHref?: string;
}

import { CALENDLY_URL } from '../../../Constants/Constants';

export default function CTASection({
  title = "Ready to Launch Your Chicago Small Business Website?",
  description = "I'm Tulio — ex-logistics pro turned web dev, building modern websites for small businesses in Humboldt Park, Portage Park & greater Chicago. Schedule a free 15-minute site audit to discover how a strategic website can boost your business. No fluff, just results: more bookings, calls, and sales.",
  primaryButtonText = "Book Free 15-Min Site Audit →",
  primaryButtonHref = CALENDLY_URL,
  secondaryButtonText = "See Recent Work",
  secondaryButtonHref = "/#projects"
}: CTASectionProps) {
  return (
    <div className="bg-gradient-to-r from-orange-500/5 to-orange-600/5 rounded-2xl p-8 text-center">
      <h2 className="text-3xl font-main font-bold text-orange-500 mb-4">
        {title}
      </h2>
      <p className="text-orange-100 mb-6 max-w-2xl mx-auto">
        {description} Learn more about our <a href="/about" className="text-white underline hover:text-orange-200">web design process</a> and <a href="/blog" className="text-white underline hover:text-orange-200">SEO strategies</a> for Chicago small businesses.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <a 
          href={primaryButtonHref} 
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white text-orange-600 px-8 py-3 rounded-lg font-semibold hover:bg-orange-50 transition-colors duration-200"
        >
          {primaryButtonText}
        </a>
        <a 
          href={secondaryButtonHref} 
          className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-orange-600 transition-colors duration-200"
        >
          {secondaryButtonText}
        </a>
      </div>
    </div>
  );
}

