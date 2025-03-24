import { lazy, ComponentType } from 'react';

interface LazyLoadOptions {
  fallback?: React.ReactNode;
  preload?: boolean;
  ssr?: boolean;
}

export function lazyLoad<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyLoadOptions = {}
) {
  const LazyComponent = lazy(importFn);

  if (options.preload) {
    // Start loading the component in the background
    importFn();
  }

  return LazyComponent;
}

// Preload specific routes or components
export const preloadComponent = (importFn: () => Promise<any>) => {
  return () => {
    importFn().catch(console.error);
  };
};

// Helper to preload images
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
};