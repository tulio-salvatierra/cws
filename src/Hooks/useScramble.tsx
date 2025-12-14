
import { useGSAP } from "@gsap/react";
import { useRef } from "react";

const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";

export function useScramble(text: string, duration: number = 1) {
  const containerRef = useRef<HTMLDivElement>(null);

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
            return chars[Math.floor(Math.random() * chars.length)]; // Random char for unrevealed
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