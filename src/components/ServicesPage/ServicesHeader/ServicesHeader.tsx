import MaskedLines from '@/components/MaskedLines/MaskedLines';
import { useScramble } from '@/Hooks/useScramble';

interface ServicesHeaderProps {
  title?: string;
  description?: string;
}

export default function ServicesHeader({
  title = "Custom Web Design & Growth Services in Chicago",
  description = "Professional web design services in Chicago including website redesign, responsive web design, and conversion-focused web design for small businesses."
}: ServicesHeaderProps) {
  const scrambleRef = useScramble(title, 0.1);

  return (
    <div className="text-center mb-16">
      <MaskedLines as="h1" scroll scrollStart="top 85%" className="text-4xl md:text-6xl font-main font-black text-orange-100 mb-4">
        {title}
      </MaskedLines>
      <p className="text-xl font-main text-zinc-900 max-w-3xl mx-auto">
        {description}
      </p>
    </div>
  );
}

