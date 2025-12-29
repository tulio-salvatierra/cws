
import { useGSAP } from "@gsap/react";
import { useRef, useEffect } from "react";

const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";

export function useScramble(text: string, duration: number = 1) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Set initial text and preserve width to prevent layout shifts
  useEffect(() => {
    if (!containerRef.current) return;
    
    const element = containerRef.current;
    
    // Set initial text
    element.textContent = text;
    
    // Store original styles for cleanup
    const originalWhiteSpace = element.style.whiteSpace;
    const originalMinWidth = element.style.minWidth;
    const originalDisplay = element.style.display;
    
    // Create a temporary span to measure the exact width of the final text
    const tempSpan = document.createElement('span');
    tempSpan.style.position = 'absolute';
    tempSpan.style.visibility = 'hidden';
    tempSpan.style.whiteSpace = 'nowrap';
    tempSpan.style.fontSize = window.getComputedStyle(element).fontSize;
    tempSpan.style.fontFamily = window.getComputedStyle(element).fontFamily;
    tempSpan.style.fontWeight = window.getComputedStyle(element).fontWeight;
    tempSpan.style.letterSpacing = window.getComputedStyle(element).letterSpacing;
    tempSpan.textContent = text;
    
    document.body.appendChild(tempSpan);
    const measuredWidth = tempSpan.offsetWidth;
    document.body.removeChild(tempSpan);
    
    // Set styles to prevent layout shifts
    element.style.whiteSpace = 'nowrap';
    element.style.minWidth = `${measuredWidth}px`;
    
    // Only change display if it's not already a block-level element
    const computedDisplay = window.getComputedStyle(element).display;
    if (computedDisplay === 'inline') {
      element.style.display = 'inline-block';
    }
    
    return () => {
      // Cleanup: restore original styles
      element.style.whiteSpace = originalWhiteSpace || '';
      element.style.minWidth = originalMinWidth || '';
      element.style.display = originalDisplay || '';
    };
  }, [text]);

  useGSAP(() => {
    if (!containerRef.current) return;

    const element = containerRef.current;
    const targetText = text;
    const iterations = 10;
    const repeatInterval = 3000; // Repeat every 3 seconds

    const runScramble = () => {
      // Create array of indices and shuffle them for random reveal order
      const indices = targetText
        .split("")
        .map((_, index) => index)
        .filter((index) => targetText[index] !== " "); // Exclude spaces from scrambling
      
      // Shuffle indices randomly
      const shuffledIndices = [...indices].sort(() => Math.random() - 0.5);
      
      let iteration = 0;
      const revealedIndices = new Set<number>();

      const scrambleInterval = setInterval(() => {
        if (iteration >= iterations) {
          element.textContent = targetText;
          clearInterval(scrambleInterval);
          return;
        }

        // Reveal one random character per iteration
        const charsToReveal = Math.floor((iteration / iterations) * shuffledIndices.length);
        for (let i = 0; i < charsToReveal && i < shuffledIndices.length; i++) {
          revealedIndices.add(shuffledIndices[i]);
        }

        const scrambled = targetText
          .split("")
          .map((char, index) => {
            if (char === " ") return " "; // Keep spaces as-is
            if (revealedIndices.has(index)) {
              return targetText[index]; // Show correct character if revealed
            }
            // Use characters with similar width to prevent layout shifts
            // Prefer uppercase letters and numbers which are more consistent in width
            const similarWidthChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            return similarWidthChars[Math.floor(Math.random() * similarWidthChars.length)];
          })
          .join("");

        element.textContent = scrambled;
        iteration += 1 / iterations;
      }, (duration * 1000) / iterations);
    };

    // Run immediately
    runScramble();

    // Repeat every 3 seconds
    const repeatTimer = setInterval(() => {
      runScramble();
    }, repeatInterval);

    return () => {
      clearInterval(repeatTimer);
    };
  }, { scope: containerRef, dependencies: [text, duration] });

  return containerRef;
}