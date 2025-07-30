import { useEffect } from 'react';
import gsap from 'gsap';

export function useLoaderAnimation() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // To change the elements targeted or the words used in the animation,
    // modify the selectors '[data-loading-container]', '[data-loading-words]', '[data-loading-words-target]',
    // or update the 'data-loading-words' attribute in your HTML.
    const loadingContainer = document.querySelector('[data-loading-container]');
    if (!loadingContainer) return;

    const loadingWords = loadingContainer.querySelector('[data-loading-words]');
    const wordsTarget = loadingWords?.querySelector('[data-loading-words-target]');
    const wordsAttr = loadingWords?.getAttribute('data-loading-words');
    if (!loadingWords || !wordsTarget || !wordsAttr) return;

    const words = wordsAttr.split(',').map(w => w.trim());
    const tl = gsap.timeline();

    // Adjust the initial vertical offset of the loading words by changing yPercent here.
    tl.set(loadingWords, {
      yPercent: 50
    });

    // Control the entrance animation's duration and easing by modifying 'duration' and 'ease' here.
    tl.to(loadingWords, { 
      opacity: 1, 
      yPercent: 0, 
      duration: .4,
      ease: "Expo.easeInOut"
    });

    // Change the delay between each word change by modifying the value in '+=0.3' inside tl.call.
    words.forEach(word => {
      tl.call(() => {
        wordsTarget.textContent = word;
      }, undefined, '+=0.2');
    });

    // Adjust the exit animation's duration and easing for the words fade out here.
    tl.to(loadingWords, { 
      opacity: 0, 
      yPercent: -75, 
      duration: .5,
      ease: "Expo.easeIn"
    });

    // Modify the delay before hiding the container and the duration of the hide animation here.
    tl.to(loadingContainer, { 
      autoAlpha: 0, 
      duration: .5,
      ease: "Power1.easeInOut"
    }, "+=.4");
  }, []);
}