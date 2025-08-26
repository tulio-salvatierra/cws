
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
  