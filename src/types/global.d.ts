
declare module "*.json" {
  const value: Record<string, unknown>;
  export default value;
}

declare module "*.glb" {
  const src: string;
  export default src;
}

declare module "*.mp4" {

    const src: string;
  
    export default src;
  
  }

  declare module "*.svg" {

    const src: string;
  
    export default src;
  
  }

  declare module "*.png" {

    const src: string;
  
    export default src;
  
  }

declare module "*.jpg" {

    const src: string;
  
    export default src;
  
  }

declare module "*.jpeg" {

    const src: string;
  
    export default src;
  
  }
  
// Vite `?url` imports
declare module "*.png?url" {
  const src: string;
  export default src;
}

declare module "*.jpg?url" {
  const src: string;
  export default src;
}

declare module "*.jpeg?url" {
  const src: string;
  export default src;
}

declare module "*.svg?url" {
  const src: string;
  export default src;
}

interface ImportMetaEnv {
  readonly VITE_GOOGLE_MAPS_API_KEY?: string;
  readonly VITE_GOOGLE_MAPS_MAP_ID?: string;
}

interface Window {
  google?: {
    maps: {
      importLibrary: (name: string) => Promise<unknown>;
    };
  };
}

declare namespace JSX {
  interface IntrinsicElements {
    "gmp-map": {
      center?: string;
      zoom?: string;
      "map-id"?: string;
      style?: {
        display?: string;
        width?: string;
        height?: string;
        minHeight?: string;
      };
      children?: unknown;
    };
    "gmp-advanced-marker": {
      position?: string;
      title?: string;
    };
  }
}
  