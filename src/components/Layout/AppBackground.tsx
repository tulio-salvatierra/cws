import { memo } from "react";
import HeroBackground from "../Hero/HeroBackground";
import Decorative from "../../assets/images/Frame13.svg";

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
          src={Decorative}
          alt="Decorative"
          className="app-background__decorative-image"
          draggable={false}
        />
      </div>
    </>
  );
}

export default memo(AppBackground);
