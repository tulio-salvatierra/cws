import { memo, useEffect, useState } from "react";
import UnicornScene from "unicornstudio-react";

const HERO_UNICORN_PROJECT_ID = "HKYKqVlhhZgjIjgZvN9q";
const HERO_UNICORN_SDK_URL =
  "https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v2.2.6/dist/unicornStudio.umd.js";

/** Extra render area so the scene fills the viewport edge-to-edge. */
const WIDTH_OVERSCAN = 1.2;
const HEIGHT_OVERSCAN = 1.45;

function getSceneDimensions() {
  return {
    width: Math.round(window.innerWidth * WIDTH_OVERSCAN),
    height: Math.round(window.innerHeight * HEIGHT_OVERSCAN),
  };
}

function HeroBackground() {
  const [dimensions, setDimensions] = useState(getSceneDimensions);

  useEffect(() => {
    const handleResize = () => {
      setDimensions(getSceneDimensions());
    };

    handleResize();
    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <UnicornScene
      projectId={HERO_UNICORN_PROJECT_ID}
      sdkUrl={HERO_UNICORN_SDK_URL}
      width={dimensions.width}
      height={dimensions.height}
      scale={1}
      dpi={1.5}
      lazyLoad={false}
      showPlaceholderWhileLoading={false}
      showPlaceholderOnError
      ariaLabel="Hero background animation"
      className="hero-unicorn-scene"
    />
  );
}

export default memo(HeroBackground);
