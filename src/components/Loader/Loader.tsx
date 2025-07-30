import { useLoaderAnimation } from "@/Hooks/Loader";
import "./Loader.css";

export default function Loader() {
  useLoaderAnimation();

  return (
    <div data-loading-container className="loading-container">
      <div className="loading-screen">
        <div
          data-loading-words="To, Cicero, Web, Studio"
          className="loading-words font-main font-black tracking-tight"
        >
          <div className="loading-words__dot"></div>
          <p data-loading-words-target className="loading-words__word">
            Welcome
          </p>
        </div>
      </div>
    </div>
  );
}
