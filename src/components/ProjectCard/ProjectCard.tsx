
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

interface ProjectCardProps {
  title: string;
  images: string;
  alt: string;
  description: string;
  link: string;
}

export default function ProjectCard({ title, images, alt, description, link }: ProjectCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const card = cardRef.current;
    const image = imageRef.current;
    
    if (!card || !image) return;

    // Initial entrance animation
    gsap.fromTo(card, 
      {
        opacity: 0,
        y: 50,
        scale: 0.9
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: {
          trigger: card,
          start: "top 90%",
          toggleActions: "play none none reverse"
        }
      }
    );

    // Create parallax effect for the image
    const parallaxTl = gsap.timeline({
      scrollTrigger: {
        trigger: card,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
        onUpdate: (self) => {
          // Calculate parallax offset based on scroll progress
          const progress = self.progress;
          const yPercent = (progress - 0.5) * 30; // Reduced intensity for smoother effect
          
          gsap.set(image, {
            yPercent: yPercent,
            ease: "none"
          });
        }
      }
    });

    // Scale effect on hover
    const hoverTl = gsap.timeline({ paused: true });
    hoverTl.to(image, {
      scale: 1.1,
      duration: 0.4,
      ease: "power2.out"
    });

    const handleMouseEnter = () => hoverTl.play();
    const handleMouseLeave = () => hoverTl.reverse();

    card.addEventListener("mouseenter", handleMouseEnter);
    card.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      parallaxTl.kill();
      hoverTl.kill();
      card?.removeEventListener("mouseenter", handleMouseEnter);
      card?.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div 
      ref={cardRef}
      className="rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 h-auto flex flex-col"
    >
      <div className="relative h-72 overflow-hidden flex-shrink-0">
        {images.endsWith('.mp4') ? (
          <video
            ref={imageRef}
            src={images}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-64 object-cover"
            style={{ 
              willChange: 'transform',
              transform: 'translateY(-20px)' // Initial offset for parallax
            }}
            onEnded={(e) => {
              e.currentTarget.currentTime = 0;
              e.currentTarget.play();
            }}
          />
        ) : (
          <img
            ref={imageRef}
            src={images}
            alt={alt || "Project Image"}
            loading="lazy"
            className="w-full h-64 object-cover"
            style={{ 
              willChange: 'transform',
              transform: 'translateY(-20px)' // Initial offset for parallax
            }}
            onError={(e) => {
              console.error('Project card image failed to load:', e);
              e.currentTarget.style.display = 'none';
            }}
          />
        )}
      </div>
      <div className="p-6 flex-1 flex flex-col">
        <h3 className="text-xl font-main font-semibold text-orange-700">
          {title}
        </h3>
        <p className="mt-2 text-white text-sm">{description}</p>
        <a
          href={link}
          target="_blank"
          className="inline-block mt-4 text-white font-medium hover:underline transition-colors duration-200 mt-auto"
          rel="noopener noreferrer"
        >
          View Project →
        </a>
      </div>
    </div>
  );
}
