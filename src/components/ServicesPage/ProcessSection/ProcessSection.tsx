import { ProcessStep } from '../types';
import { useFadeIn } from '../../../Hooks/useFadeIn';

interface ProcessSectionProps {
  title?: string;
  steps?: ProcessStep[];
}

const defaultSteps: ProcessStep[] = [
  {
    number: "1",
    title: "Discovery",
    description: "We learn about your goals, audience and challenges."
  },
  {
    number: "2",
    title: "Planning",
    description: "We define strategy, design, features and timelines."
  },
  {
    number: "3",
    title: "Development",
    description: "We build your solution with frequent updates and joint reviews."
  },
  {
    number: "4",
    title: "Launch & Beyond",
    description: "We deploy, test and provide ongoing support."
  }
];

export default function ProcessSection({
  title = "How We Work Together",
  steps = defaultSteps
}: ProcessSectionProps) {
  const fadeInRef = useFadeIn();
  return (
    <div className=" rounded-2xl p-8 mb-16 mx-8">
      <h2 ref={fadeInRef} className="text-3xl font-main font-semibold text-orange-500 mb-8 text-center">
        {title}
      </h2>
      <div ref={fadeInRef} className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        {steps.map((step) => (
          <div key={step.number}  className="text-left bg-zinc-800/30 rounded-2xl sm:p-8 p-2">
            <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-center text-2xl font-bold text-white">{step.number}</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">{step.title}</h3>
            <p className="text-zinc-400 text-left">{step.description}</p>
          </div>
        ))}
      </div>
      <div ref={fadeInRef} className="mt-8 text-center text-zinc-300">
        <p className="mb-4 text-left">
          Our process ensures transparency, quality and results. Each stage is designed so you know what's happening and why.
        </p>
        <p className="text-left">
          <a href="/about" className="text-orange-500 hover:text-orange-400 underline font-semibold">Learn more about our complete process →</a>
        </p>
      </div>
    </div>
  );
}

