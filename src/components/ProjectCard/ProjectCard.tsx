
import { useRef } from "react";
import { useFadeIn } from "../../Hooks/useFadeIn";
import MaskedLines from "../MaskedLines/MaskedLines";

interface ProjectCardProps {
  title: string;
  images: string;
  alt: string;
  description: string;
  link: string;
}

export default function ProjectCard({ title, images, alt, description, link }: ProjectCardProps) {
  const imageRef = useRef<HTMLImageElement | HTMLVideoElement>(null);
  const fadeInRef = useFadeIn();
  return (
    <div ref={fadeInRef} className="group relative w-full h-auto min-h-full overflow-hidden rounded-lg hover:shadow-2xl transition-all duration-300">
      <div className="absolute inset-0 overflow-hidden">
        {images.endsWith('.mp4') ? (
          <video
            ref={imageRef as React.RefObject<HTMLVideoElement>}
            src={images}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            disablePictureInPicture
            disableRemotePlayback
            className="absolute inset-0 w-full h-[50vh] object-cover transition-transform duration-300 group-hover:scale-105"
            onEnded={(e) => {
              e.currentTarget.currentTime = 0;
              e.currentTarget.play();
            }}
            onLoadStart={(e) => {
              e.currentTarget.play().catch(() => {});
            }}
            onCanPlay={(e) => {
              // Start playing as soon as video can play
              e.currentTarget.play().catch(() => {
                // Silent fallback
              });
            }}
          />
        ) : (
          <img
            ref={imageRef as React.RefObject<HTMLImageElement>}
            src={images}
            alt={alt || "Project Image"}
            loading="lazy"
            className="absolute inset-0 w-full h-[50vh] object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              console.error('Project card image failed to load:', e);
              e.currentTarget.style.display = 'none';
            }}
          />
        )}

        {/* Text overlay: visible on hover (desktop), always visible (mobile) */}
        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/90 via-black/50 to-transparent p-1 transition-opacity duration-300 opacity-100 md:opacity-0 md:group-hover:opacity-100" style={{ zIndex: 1000 }}>
          <h3 ref={fadeInRef} className="text-2xl sm:text-3xl font-main font-semibold text-white">
            {title}
          </h3>
          <MaskedLines
            as="p"
            scroll
            scrollStart="top 85%"
            className="font-main text-zinc-200 text-xl line-clamp-2 w-full"
          >
            {description}
          </MaskedLines>
          <div ref={fadeInRef} className="mt-2">
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-orange-400 font-main hover:text-orange-300 hover:underline transition-colors duration-200"
            >
              View Project →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
