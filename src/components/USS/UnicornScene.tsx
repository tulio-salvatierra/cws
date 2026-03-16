import { memo } from "react";
import UnicornSceneEmbed from "unicornstudio-react";
import "./uni.css";

const UNICORN_PROJECT_ID = "QRARWWwdM7zickWcepHp";
const UNICORN_SDK_URL =
  "https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v2.0.5/dist/unicornStudio.umd.js";

function UnicornScenePage() {
  return (
    <div
      className="unicorn-studio-page w-full shrink-0"
      style={{ height: "75vh" }}
    >
      <div
        className="unicorn-studio-container w-full h-full relative"
        style={{ width: "100%", height: "100%" }}
      >
        <UnicornSceneEmbed
          projectId={UNICORN_PROJECT_ID}
          sdkUrl={UNICORN_SDK_URL}
          width="100%"
          height="100%"
          scale={1}
          dpi={3}
          showPlaceholderWhileLoading={false}
          showPlaceholderOnError={true}
        />
      </div>
    </div>
  );
}

export default memo(UnicornScenePage);
