import { useEffect, useRef, useState } from "react";

type ProcessStepMediaProps = {
  video?: string;
  poster?: string;
  isActive: boolean;
};

export default function ProcessStepMedia({
  video,
  poster,
  isActive,
}: ProcessStepMediaProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showPoster, setShowPoster] = useState(!video);

  useEffect(() => {
    setShowPoster(!video);
  }, [video]);

  useEffect(() => {
    const element = videoRef.current;
    if (!element || showPoster) return;

    if (isActive) {
      const playPromise = element.play();
      if (playPromise) {
        playPromise.catch(() => {});
      }
      return;
    }

    element.pause();
    element.currentTime = 0;
  }, [isActive, showPoster]);

  if (video && !showPoster) {
    return (
      <video
        ref={videoRef}
        className="process-section__media-asset"
        src={video}
        poster={poster}
        muted
        loop
        playsInline
        preload="metadata"
        onError={() => setShowPoster(true)}
      />
    );
  }

  if (poster) {
    return (
      <img
        className="process-section__media-asset"
        src={poster}
        alt=""
        loading="lazy"
      />
    );
  }

  return <div className="process-section__media-fallback" aria-hidden />;
}
