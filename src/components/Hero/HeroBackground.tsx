import { memo } from "react";
import UnicornScene from "unicornstudio-react";

const HERO_UNICORN_PROJECT_ID = "HKYKqVlhhZgjIjgZvN9q";
const HERO_UNICORN_SDK_URL =
  "https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v2.2.6/dist/unicornStudio.umd.js";

function HeroBackground() {
  return (
    <UnicornScene
      projectId={HERO_UNICORN_PROJECT_ID}
      width="100%"
      height="100%"
      scale={1}
      dpi={1}
      sdkUrl={HERO_UNICORN_SDK_URL}
      lazyLoad={false}
      showPlaceholderWhileLoading={false}
      showPlaceholderOnError
      ariaLabel="Hero background animation"
      className="hero-unicorn-scene"
    />
  );
}

export default memo(HeroBackground);
