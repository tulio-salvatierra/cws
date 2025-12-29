import { WhyChooseItem } from '../types';

interface WhyChooseUsSectionProps {
  title?: string;
  items?: WhyChooseItem[];
}

const defaultItems: WhyChooseItem[] = [
  {
    icon: "🚀",
    title: "Fast Delivery",
    description: "Quick turnaround times without compromising quality or attention to detail"
  },
  {
    icon: "💎",
    title: "Premium Quality",
    description: "High-end solutions built with modern technologies and best practices"
  },
  {
    icon: "🤝",
    title: "Ongoing Support",
    description: "Continuous support and maintenance to keep your solution running smoothly"
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
            <div className="text-4xl mb-4">{item.icon}</div>
            <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
            <p className="text-zinc-400">{item.description}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 text-center">
        <p className="text-zinc-300 mb-4">
          Ready to see what we can do for your business? <a href="/contact" className="text-orange-500 hover:text-orange-400 underline">Contact us</a> for a free consultation, or explore our <a href="/about" className="text-orange-500 hover:text-orange-400 underline">about page</a> to learn more about our process and expertise.
        </p>
      </div>
    </div>
  );
}

