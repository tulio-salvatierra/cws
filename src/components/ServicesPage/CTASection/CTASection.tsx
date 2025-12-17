interface CTASectionProps {
  title?: string;
  description?: string;
  primaryButtonText?: string;
  primaryButtonHref?: string;
  secondaryButtonText?: string;
  secondaryButtonHref?: string;
}

export default function CTASection({
  title = "Ready to Get Started?",
  description = "Let's discuss your project and create something amazing together. Get in touch for a free consultation and quote.",
  primaryButtonText = "Start Your Project",
  primaryButtonHref = "mailto:info@cicerowebstudio.xyz",
  secondaryButtonText = "Call Us Now",
  secondaryButtonHref = "tel:+17863146121"
}: CTASectionProps) {
  return (
    <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 text-center">
      <h2 className="text-3xl font-main font-bold text-white mb-4">
        {title}
      </h2>
      <p className="text-orange-100 mb-6 max-w-2xl mx-auto">
        {description}
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

