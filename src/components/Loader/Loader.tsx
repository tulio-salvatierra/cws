import { useRef } from "react";
import { useLoaderAnimation } from "@/Hooks/Loader";
import logoSrc from "@/assets/Images/Frame13.svg";
import "./Loader.css";

/** Native dimensions from Frame13.svg — keeps aspect ratio when scaling */
const LOGO_WIDTH = 1696;
const LOGO_HEIGHT = 1101;

type LoaderProps = {
  onComplete?: () => void;
};

export default function Loader({ onComplete }: LoaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLImageElement>(null);
  const countRef = useRef<HTMLParagraphElement>(null);

  useLoaderAnimation({
    onComplete,
    containerRef,
    screenRef,
    logoRef,
    countRef,
  });

  return (
    <div
      ref={containerRef}
      data-loading-container
      className="loading-container"
      aria-hidden="false"
      aria-busy="true"
      aria-label="Loading site"
    >
      <div ref={screenRef} data-loading-screen className="loading-screen">
        <div className="loading-content">
          <img
            ref={logoRef}
            data-loading-logo
            src={logoSrc}
            alt="Cicero Web Studio"
            width={LOGO_WIDTH}
            height={LOGO_HEIGHT}
            className="loading-logo"
            loading="eager"
            decoding="sync"
          />
          <p
            ref={countRef}
            data-loading-count
            className="loading-count font-main"
          >
            0
          </p>
        </div>
      </div>
    </div>
  );
}
