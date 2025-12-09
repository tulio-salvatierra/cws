
import PropTypes from 'prop-types';
import './TM.css';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

    export default function TileMask({ text }: { text: string }): JSX.Element {

    useGSAP(
        () => {
            // Only animate .scroll if it exists
            const scrollElement = document.querySelector('.scroll');
            if (scrollElement) {
                gsap.to('.scroll', {
                    autoAlpha:0,
                    duration:0.2,
                    scrollTrigger: {
                        trigger: document.body,
                        start:'top top',
                        end:'top top-=1',
                        toggleActions: "play none reverse none"
                    }
                });
            }
        
            // Only animate word elements if they exist
            const wordElements = document.querySelectorAll('.word');
            if (wordElements.length > 0) {
                wordElements.forEach(word => {
                    if (word.children.length > 0) {
                        gsap.to(word.children, {
                            yPercent: '+=100', // Increase the y position by 100%
                            ease:'expo.inOut',
                            scrollTrigger:{
                                trigger: word, // Listens to the position of word
                                start: "bottom bottom",
                                end: "top 55%",
                                scrub: 0.4 // Smooth scrubbing, takes 0.4 seconds to complete
                            }
                        });
                    }
                });
            }
        },
    );
  return (
    <p className="text-orange-500 font-main text-2xl sm:text-3xl lg:text-4xl">
    <span className="word">
        <span className="word-hidden">{text}</span>
        <span className="word-visible">{text}</span>
    </span> <span className="word">
        <span className="word-hidden">{text}</span>
        <span className="word-visible">{text}</span>
    </span> ...
    </p>
  )
}

TileMask.propTypes = {
  text: PropTypes.string.isRequired,
};

