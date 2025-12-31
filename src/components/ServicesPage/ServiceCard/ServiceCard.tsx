import { useFadeIn } from '@/Hooks/useFadeIn';
import MaskedLines from '../../MaskedLines/MaskedLines';
import { Service } from '../types';

interface ServiceCardProps {
  service: Service;
}

export default function ServiceCard({ service }: ServiceCardProps) {
  const fadeInRef = useFadeIn();
  const fadeInRef2 = useFadeIn();

  return (
    <div ref={fadeInRef2} className="bg-zinc-800/10 grid grid-cols-1 md:grid-cols-2 gap-8 rounded-2xl p-8 hover:bg-zinc-800/70 transition-all duration-300">
      {/* Service Header */}
      <div className="flex-col mb-6">
        <h2 ref={fadeInRef} className="text-4xl md:text-6xl font-main font-bold text-orange-500 text-center mb-2">
          {service.title}
        </h2>
        <img ref={fadeInRef} src={service.icon} alt={service.title} className="w-full h-auto mx-auto object-cover mr-4" />
      </div>

      {/* Service Details */}
      <div className="mb-6 grid place-items-center">
        <div>
          <h3 className="sm:text-6xl text-4xl mx-auto font-bold tracking-relaxed text-white mb-8">What's Included?</h3>
          <ul className="space-y-2 text-zinc-300 w-full">
            {service.details.map((detail, index) => (
              <li key={index} className="flex items-start text-md sm:text-3xl w-full">
                <MaskedLines
                  as="span"
                  scroll
                  scrollStart="top 85%"
                  className="text-orange-500"
                >
                  •
                </MaskedLines>
                <MaskedLines
                  as="span"
                  scroll
                  scrollStart="top 85%"
                  className="text-zinc-300/80 leading-none tracking-tight"
                >
                  {detail}
                </MaskedLines>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Technologies */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">Technologies:</h3>
        <div ref={fadeInRef} className="flex flex-wrap gap-2">
          {service.technologies.map((tech, index) => (
            <span ref={fadeInRef}
              key={index}
              className="bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-sm border border-orange-500/30"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

