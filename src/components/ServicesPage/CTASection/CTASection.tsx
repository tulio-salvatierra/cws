interface CTASectionProps {
  title?: string;
  description?: string;
  primaryButtonText?: string;
  primaryButtonHref?: string;
  secondaryButtonText?: string;
  secondaryButtonHref?: string;
}

export default function CTASection({
  title = "Ready to Launch Your Chicago Small Business Website?",
  description = "Get a free consultation for custom web design, mobile-first responsive websites, and local SEO services for Chicago, Cicero, and Chicagoland businesses. Affordable solutions that drive leads and boost online visibility.",
  primaryButtonText = "Get Free Quote",
  primaryButtonHref = "mailto:info@cicerowebstudio.xyz",
  secondaryButtonText = "Call Us Now",
  secondaryButtonHref = "tel:+17863146121"
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

