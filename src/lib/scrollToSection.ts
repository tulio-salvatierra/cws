export function getLenis() {
  return (
    window as Window & {
      lenis?: {
        scrollTo: (
          target: Element | number | string,
          options?: { duration?: number; offset?: number },
        ) => void;
      };
    }
  ).lenis;
}

export function scrollToSection(
  sectionId: string,
  options?: { duration?: number; offset?: number },
) {
  const id = sectionId.replace(/^#/, "");
  const element = document.getElementById(id);
  if (!element) return false;

  const lenis = getLenis();
  if (lenis) {
    lenis.scrollTo(element, {
      duration: options?.duration ?? 1.2,
      offset: options?.offset ?? -80,
    });
  } else {
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return true;
}
