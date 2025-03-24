import { useState, useEffect, useRef, ReactNode } from 'react';
import { useInView } from 'react-intersection-observer';
import { prefetchRoute } from '../utils/prefetch';

// Types for component props
interface InstantTransitionProps {
  children: ReactNode;
  importFn: () => Promise<any>;
  routeKey: string;
  preloadOnMount?: boolean;
  preloadOnInView?: boolean;
  preloadOnHover?: boolean;
  delay?: number;
  threshold?: number;
  rootMargin?: string;
}

export function InstantTransition({
  children,
  importFn,
  routeKey,
  preloadOnMount = false,
  preloadOnInView = true,
  preloadOnHover = true,
  delay = 200,
  threshold = 0.1,
  rootMargin = '200px',
}: InstantTransitionProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Set up intersection observer for viewport detection
  const { ref, inView } = useInView({
    threshold,
    rootMargin,
    triggerOnce: true,
  });
  
  // Preload on mount if enabled
  useEffect(() => {
    if (preloadOnMount && !hasLoaded) {
      prefetchRoute(importFn, routeKey);
      setHasLoaded(true);
    }
  }, [preloadOnMount, importFn, routeKey, hasLoaded]);
  
  // Preload when in viewport if enabled
  useEffect(() => {
    if (preloadOnInView && inView && !hasLoaded) {
      prefetchRoute(importFn, routeKey);
      setHasLoaded(true);
    }
  }, [preloadOnInView, inView, importFn, routeKey, hasLoaded]);
  
  // Handle mouse enter - start preload timer
  const handleMouseEnter = () => {
    if (preloadOnHover && !hasLoaded) {
      setIsHovered(true);
      timer.current = setTimeout(() => {
        prefetchRoute(importFn, routeKey);
        setHasLoaded(true);
      }, delay);
    }
  };
  
  // Handle mouse leave - clear timer if not yet loaded
  const handleMouseLeave = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    setIsHovered(false);
  };
  
  // Clean up any timers on unmount
  useEffect(() => {
    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    };
  }, []);
  
  return (
    <div
      ref={ref}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleMouseEnter}
      className={isHovered ? 'instant-transition-hovered' : ''}
    >
      {children}
    </div>
  );
} 