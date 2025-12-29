import { WhyChooseItem } from '../types';

interface WhyChooseUsSectionProps {
  title?: string;
  items?: WhyChooseItem[];
}

const defaultItems: WhyChooseItem[] = [
  {
    icon: "🚀",
    title: "Fast Delivery",
    description: "Quick turnaround for mobile-first responsive websites and custom web design projects without compromising quality or performance optimization"
  },
  {
    icon: "💎",
    title: "Premium Quality",
    description: "High-end custom websites built with React, Next.js, and modern web development technologies following SEO best practices"
  },
  {
    icon: <img src="/images/Lifering.png" alt="Ongoing Support" className="w-10 h-10" />,
    title: "Ongoing Support",
    description: "Continuous website maintenance, local SEO updates, and technical support to keep your Chicago small business website running smoothly"
  }
];

export default function WhyChooseUsSection({
  title = "Why Choose Cicero Web Studio?",
  items = defaultItems
}: WhyChooseUsSectionProps) {
  return (
    <div className="bg-zinc-800/50 rounded-2xl p-8 mb-16">
      <h2 className="text-3xl font-main font-bold text-orange-500 mb-8 text-center">
        {title}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {items.map((item, index) => (
          <div key={index} className="text-center">
            <div className="flex justify-center items-center mb-4">
              {typeof item.icon === 'string' ? (
                <span className="text-4xl">{item.icon}</span>
              ) : (
                item.icon
              )}
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
            <p className="text-zinc-400">{item.description}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 text-center">
        <p className="text-zinc-300 mb-4">
          Ready to boost your online presence with custom web design and local SEO services? <a href="/contact" className="text-orange-500 hover:text-orange-400 underline">Contact us</a> for a free consultation on affordable website solutions for Chicago, Cicero, and Chicagoland businesses. Explore our <a href="/about" className="text-orange-500 hover:text-orange-400 underline">web development process</a> and see how we help small businesses drive leads and improve search rankings.
        </p>
      </div>
    </div>
  );
}

