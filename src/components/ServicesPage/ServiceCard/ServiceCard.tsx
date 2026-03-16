import { useFadeIn } from '@/Hooks/useFadeIn';
import MaskedLines from '../../MaskedLines/MaskedLines';
import { Service } from '../types';
import CustomButton from '@/components/CustomButton';

interface ServiceCardProps {
  service: Service;
}

export default function ServiceCard({ service }: ServiceCardProps) {
  const fadeInRef = useFadeIn();
  const fadeInRef2 = useFadeIn();

  return (
    <div ref={fadeInRef2} className="bg-zinc-800/20 grid grid-cols-1 md:grid-cols-2 gap-8 rounded-2xl p-8 hover:bg-zinc-800/70 transition-all duration-300">
      {/* Service Header */}
      <div className="flex-col mb-6">
        <h2 ref={fadeInRef} className="text-4xl md:text-6xl font-main font-bold text-orange-500 text-center mb-4">
          {service.title}
        </h2>
        <MaskedLines
          as="p"
          scroll
          scrollStart="top 85%"
          className="text-zinc-900 font-main text-2xl md:text-3xl text-center mb-4 max-w-2xl mx-auto"
        >
          {service.description}
        </MaskedLines>
        <img ref={fadeInRef} src={service.icon} alt={service.title} className="w-full h-auto mx-auto object-cover mr-4" />
      </div>

      {/* Service Details */}
      <div className="mb-6 grid place-items-center">
        <div>
          <h3 className="sm:text-6xl text-4xl mx-auto font-bold tracking-relaxed text-black mb-8 font-main">What's Included?</h3>
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
                  className="text-zinc-300/80 font-main leading-none tracking-tight"
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
        <CustomButton
          href={`/services/${service.id}`}
          label="Learn More"
          secondary={true}
        />
      </div>
    </div>
  );
}

