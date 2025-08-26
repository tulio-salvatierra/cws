
import { useRef } from "react";

interface ProjectCardProps {
  title: string;
  images: string;
  alt: string;
  description: string;
  link: string;
}

export default function ProjectCard({ title, images, alt, description, link }: ProjectCardProps) {
  const imageRef = useRef<HTMLImageElement | HTMLVideoElement>(null);

  return (
    <div className="rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 h-auto flex flex-col group">
      <div className="relative h-72 flex-shrink-0 overflow-hidden">
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
            className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
            onEnded={(e) => {
              e.currentTarget.currentTime = 0;
              e.currentTarget.play();
            }}
            onLoadStart={(e) => {
              // Ensure video starts playing immediately when loaded
              e.currentTarget.play().catch(() => {
                // Fallback if autoplay fails
                console.log('Autoplay prevented, will retry on user interaction');
              });
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
            className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
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
          className="inline-block text-zinc-400 font-medium hover:text-orange-500 hover:underline transition-colors duration-200 mt-auto"
          rel="noopener noreferrer"
        >
          View Project →
        </a>
      </div>
    </div>
  );
}
