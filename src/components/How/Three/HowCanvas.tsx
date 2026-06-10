import { useEffect, useRef } from "react";
import { createHowScene } from "./scene";

export default function HowCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scene = createHowScene(canvas);
    let rafId = 0;

    const tick = () => {
      scene.render();
      rafId = requestAnimationFrame(tick);
    };

    tick();

    const onResize = () => scene.resize();
    window.addEventListener("resize", onResize);

    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(canvas);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      resizeObserver.disconnect();
      scene.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className="how-canvas" aria-hidden />;
}
