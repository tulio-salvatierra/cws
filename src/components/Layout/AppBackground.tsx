import { memo } from "react";
import HeroBackground from "../Hero/HeroBackground";
import ciceroWebStudio from "../../assets/images/hero/cicero-web-studio.svg";

function AppBackground() {
  return (
    <>
      <div className="app-background__gradient" />
      <div className="app-background__unicorn">
        <div className="app-background__unicorn-frame">
          <HeroBackground />
        </div>
      </div>
      <div className="app-background__decorative" aria-hidden>
        <img
          src={ciceroWebStudio}
          alt=""
          className="app-background__decorative-image"
          draggable={false}
        />
      </div>
    </>
  );
}

export default memo(AppBackground);
