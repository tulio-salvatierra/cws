import { ProcessStep } from '../types';
import { useFadeIn } from '../../../Hooks/useFadeIn';
import MaskedLines from '@/components/MaskedLines/MaskedLines';
import { Banner } from '../../StepsBanner';
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
  title = "4 SIMPLE STEPS TO GROW YOUR BUSINESS",
  steps = defaultSteps
}: ProcessSectionProps) {
  const fadeInRef = useFadeIn();
  return (
    <>
    <section className=" rounded-2xl mb-16 p bg-white">
          <div className="h-auto">
        <Banner />
      </div>
      <div ref={fadeInRef} className="grid grid-cols-1 gap-1">
        {steps.map((step) => (
          <div key={step.number}  className="text-left p-1 w-100 flex flex-col justify-start items-start">
            
              <span className="text-left sm:text-8xl text-9xl font-bold font-main text-orange-500">{step.number}</span>
            
            <h3 className="text-5xl sm:text-9xl text-left font-bold text-black mr-auto mb-2 font-main">{step.title}</h3>
            <p className="sm:text-4xl text-2xl text-zinc-500 text-left mr-auto font-main">{step.description}</p>
          </div>
        ))}
      </div>
      <div ref={fadeInRef} className="mt-16 w-75 text-center text-zinc-300 bg-white rounded-2xl p-4">
        <MaskedLines
          as="p"
          scroll
          scrollStart="top 85%"
          className="text-left sm:text-4xl text-2xl text-black font-main w-3/4 mx-auto"
        >
          Our process ensures transparency, quality and results. Each stage is designed so you know what's happening and why.
        </MaskedLines>
        
      </div>
    </section>
    
  </>
  );
}

