/// <reference types="vite/client" />

// Declare CSS modules
declare module '*.css' {
  const css: { [key: string]: string };
  export default css;
}

// Declare static assets
declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}
