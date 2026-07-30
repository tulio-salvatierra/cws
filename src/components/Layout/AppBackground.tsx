import { memo } from "react";
import HeroBackground from "../Hero/HeroBackground";

function AppBackground() {
  return (
    <>
      <div className="app-background__gradient" />
      <div className="app-background__unicorn">
        <div className="app-background__unicorn-frame">
          <HeroBackground />
        </div>
      </div>
    </>
  );
}

export default memo(AppBackground);
