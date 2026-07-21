import { useEffect, useRef, useState } from "react";

type ProcessStepMediaProps = {
  video?: string;
  poster?: string;
};

export default function ProcessStepMedia({
  video,
  poster,
}: ProcessStepMediaProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [video]);

  useEffect(() => {
    const element = videoRef.current;
    if (!element || failed) return;

    element.muted = true;
    const playPromise = element.play();
    if (playPromise) {
      playPromise.catch(() => {});
    }
  }, [failed, video]);

  const showVideo = Boolean(video && !failed);

  return (
    <div className="process-section__media-stack">
      {poster ? (
        <img
          className="process-section__media-poster"
          src={poster}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div className="process-section__media-fallback" aria-hidden />
      )}

      {showVideo && (
        <video
          ref={videoRef}
          className="process-section__media-video"
          src={video}
          muted
          loop
          playsInline
          autoPlay
          preload="metadata"
          disablePictureInPicture
          disableRemotePlayback
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
