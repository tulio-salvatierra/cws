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
    description: "Understanding your needs, goals, and requirements through detailed consultation"
  },
  {
    number: "2",
    title: "Planning",
    description: "Creating detailed project plans, timelines, and technical architecture"
  },
  {
    number: "3",
    title: "Development",
    description: "Building your solution with regular updates and milestone reviews"
  },
  {
    number: "4",
    title: "Launch",
    description: "Deployment, testing, and ongoing support to ensure success"
  }
];

export default function ProcessSection({
  title = "Our Development Process",
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
          Our process is designed to ensure transparency, quality, and results. We work closely with businesses in Chicago, Cicero, and surrounding areas to deliver solutions that drive growth. 
        </p>
        <p className="text-left">
          Want to learn more? Check out our <a href="/about" className="text-orange-500 hover:text-orange-400 underline">about page</a> to see our approach, or <a href="/contact" className="text-orange-500 hover:text-orange-400 underline">contact us</a> to discuss your project.
        </p>
      </div>
    </div>
  );
}

