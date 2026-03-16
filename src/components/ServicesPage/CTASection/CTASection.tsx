interface CTASectionProps {
  title?: string;
  description?: string;
  primaryButtonText?: string;
  primaryButtonHref?: string;
  secondaryButtonText?: string;
  secondaryButtonHref?: string;
}

import { CALENDLY_URL } from '../../../Constants/Constants';
import CustomButton from "@/components/CustomButton";

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
      <h2 className="text-4xl font-main font-bold text-white mb-4">
        {title}
      </h2>
      <p className="text-zinc-900 font-main mb-6 max-w-2xl mx-auto text-xl">
        {description} Learn more about our <a href="/about" className="text-orange-500 hover:text-orange-4  00 underline">web design process</a> and <a href="/blog" className="text-orange-500 hover:text-orange-400 underline">SEO strategies</a> for Chicago small businesses.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <CustomButton
          href={primaryButtonHref}
          label={primaryButtonText}
          newTab={true}
        />
        <CustomButton
          href={secondaryButtonHref}
          label={secondaryButtonText}
          secondary={true}
        />
      </div>
    </div>
  );
}

