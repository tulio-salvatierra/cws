import { useEffect, useRef } from "react";
import gsap from "gsap";
import "./BigWord.css";

interface BigWordProps {
  text: string;
  className?: string;
}

export default function BigWord({ text, className = "" }: BigWordProps) {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const duplicateElement = section.querySelector('.duplicate') as HTMLElement;
    if (!duplicateElement) return;

    // Modifies the CSS variable --xpercent
    const xTo = gsap.quickTo(duplicateElement, '--xpercent', {
      duration: 0.4, // Changes over 0.4s
      ease: "back" // With a slight bounce at the end of the movement
    });

    // Modifies the CSS variable --ypercent
    const yTo = gsap.quickTo(duplicateElement, '--ypercent', {
      duration: 0.4, // Changes over 0.4s
      ease: "back" // With a slight bounce at the end of the movement
    });

    const handleMouseMove = (e: MouseEvent) => {
      // Maps the mouse's X position from the window width range (0 to innerWidth)  
      // to a normalized range (0 to 100)  
      const mRangeX = gsap.utils.mapRange(0, window.innerWidth, 0, 100, e.clientX);

      // Update the X position smoothly  
      xTo(mRangeX);

      // Maps the mouse's Y position relative to the element's bounding box  
      // to a normalized range (0 to 100)  
      const bound = section.getBoundingClientRect();
      const mRangeY = gsap.utils.mapRange(bound.top, bound.top + bound.height, 0, 100, e.clientY);

      // Update the Y position smoothly  
      yTo(mRangeY);
    };

    section.addEventListener("mousemove", handleMouseMove);

    return () => {
      section.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <section ref={sectionRef} className={`mwg_effect044 ${className}`}>
      <div className="root">
        <div className="containers">
          <div className="container">
            
            <div className="line">
              <p className="font-main text-2xl sm:text-3xl lg:text-4xl">{text}</p>
            </div>
            
          <div className="container duplicate" aria-hidden="true">
            
            <div className="line">
              <p className="text-orange-500 font-main text-2xl sm:text-3xl lg:text-4xl">{text}</p>
            </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}