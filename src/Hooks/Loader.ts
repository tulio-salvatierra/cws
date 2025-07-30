import { useEffect } from 'react';
import gsap from 'gsap';

export function useLoaderAnimation() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadingContainer = document.querySelector('[data-loading-container]');
    if (!loadingContainer) return;

    const loadingWords = loadingContainer.querySelector('[data-loading-words]');
    const wordsTarget = loadingWords?.querySelector('[data-loading-words-target]');
    const wordsAttr = loadingWords?.getAttribute('data-loading-words');
    if (!loadingWords || !wordsTarget || !wordsAttr) return;

    const words = wordsAttr.split(',').map(w => w.trim());
    const tl = gsap.timeline();

    tl.set(loadingWords, {
      yPercent: 50
    });

    tl.to(loadingWords, { 
      opacity: 1, 
      yPercent: 0, 
      duration: .6,
      ease: "Expo.easeInOut"
    });

    words.forEach(word => {
      tl.call(() => {
        wordsTarget.textContent = word;
      }, undefined, '+=0.3');
    });

    tl.to(loadingWords, { 
      opacity: 0, 
      yPercent: -75, 
      duration: .4,
      ease: "Expo.easeIn"
    });

    tl.to(loadingContainer, { 
      autoAlpha: 0, 
      duration: .5,
      ease: "Power1.easeInOut"
    }, "+=.5");
  }, []);
}