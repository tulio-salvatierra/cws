import { useScramble } from '@/Hooks/useScramble';

interface ServicesHeaderProps {
  title?: string;
  description?: string;
}

export default function ServicesHeader({
  title = "SERVICES",
  description = "Solutions to help your business STAND OUT"
}: ServicesHeaderProps) {
  const scrambleRef = useScramble(title, 0.1);

  return (
    <div className="text-center mb-16">
      <h1 ref={scrambleRef} className="text-6xl md:text-8xl font-main font-black text-orange-500 mb-4">
        {title}
      </h1>
      <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
        {description}
      </p>
    </div>
  );
}

