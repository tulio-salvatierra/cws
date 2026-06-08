import { useEffect, useRef } from "react";
import lottie, { type AnimationItem } from "lottie-web";

type LottieAnimationProps = {
  path: Record<string, unknown>;
  className?: string;
};

export default function LottieAnimation({
  path,
  className = "lottie-ctn",
}: LottieAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<AnimationItem | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    animationRef.current = lottie.loadAnimation({
      container: containerRef.current,
      renderer: "svg",
      loop: true,
      autoplay: true,
      animationData: path,
    });

    return () => {
      animationRef.current?.destroy();
      animationRef.current = null;
    };
  }, [path]);

  return <div ref={containerRef} className={className} />;
}
