import PropTypes from 'prop-types';
import { useRef } from 'react';
import './TM.css';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function TileMask({ text }: { text: string }): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);

  // Split text into words
  const words = text.split(' ').filter(word => word.length > 0);

  useGSAP(
    () => {
      const container = containerRef.current;
      if (!container) return;

      // Hide container element when scrolling starts
      const containerElement = container.querySelector('.container');
      if (containerElement) {
        gsap.to(containerElement, {
          autoAlpha: 0,
          duration: 0.6,
          scrollTrigger: {
            trigger: container,
            start: "top top",
            end: "top 50%",
            scrub: 0.4 // Smooth scrubbing, takes 0.4 seconds to complete
          }
        });
      }
      // Animate each word
      const wordElements = container.querySelectorAll('.word');
      wordElements.forEach((word, index) => {
        const children = word.children;
        if (children.length >= 2) {
          const hiddenWord = children[0] as HTMLElement; // word-hidden
          const visibleWord = children[1] as HTMLElement; // word-visible
          
          // Ensure proper stacking - visible word on top initially
          gsap.set(visibleWord, { zIndex: 2 });
          gsap.set(hiddenWord, { zIndex: 1 });
          
          // Set initial states - visible word holds position, hidden word starts below
          gsap.set(visibleWord, { 
            yPercent: 0, // Start in place (visible, holding position)
            force3D: true,
            clearProps: "all"
          });
          gsap.set(hiddenWord, { 
            yPercent: 100, // Start below (not visible, ready to move up)
            force3D: true,
            clearProps: "all"
          });
          
          // Create a timeline for this word
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: word as Element,
              start: "bottom bottom",
              end: "top 55%",
              scrub: 0.4, // Smooth scrubbing, takes 0.4 seconds to complete
              invalidateOnRefresh: true
            }
          });

          // Animate visible word from 0% to -100% (moves up and out)
          // This word holds its place initially, then moves out
          tl.to(visibleWord, { 
            yPercent: -100, // End above (out of view)
            ease: 'expo.inOut',
            force3D: true
          }, 0);

          // Animate hidden word from 100% to 0% (moves up into the same position)
          // This word moves up to replace the visible word in the exact same spot
          tl.to(hiddenWord, { 
            yPercent: 60, // End in the same position (replacing visible word)
            ease: 'expo.inOut',
            force3D: true
          }, 0);
        }
      });
    },
    {
      scope: containerRef,
      dependencies: [text]
    }
  );

  return (
    <div ref={containerRef} className="mwg_effect015">
      <p className="text-orange-500 font-main text-2xl sm:text-3xl lg:text-4xl container">
        {words.map((word, index) => (
          <span key={index} className="word text-orange-500 font-main text-2xl sm:text-3xl lg:text-4xl container">
            <span className="word-hidden text-orange-500 font-main text-2xl sm:text-3xl lg:text-4xl container">{word}</span>
            <span className="word-visible text-orange-500 font-main text-2xl sm:text-3xl lg:text-4xl container">{word}</span>
            {index < words.length - 1 && ' '}
          </span>
        ))}
      </p>
    </div>
  );
}

TileMask.propTypes = {
  text: PropTypes.string.isRequired,
};

