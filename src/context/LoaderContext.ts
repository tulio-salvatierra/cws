import { createContext, useContext } from "react";

/** Delay after loader exit before hero (and similar) entrance animations run */
export const HERO_ANIMATION_DELAY_MS = 2000;

type LoaderContextValue = {
  heroReady: boolean;
};

export const LoaderContext = createContext<LoaderContextValue>({
  heroReady: false,
});

export function useLoaderReady(): LoaderContextValue {
  return useContext(LoaderContext);
}
