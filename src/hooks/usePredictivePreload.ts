import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocalStorage } from 'usehooks-ts';
import { prefetchApiData, prefetchRoute } from '../utils/prefetch';
import { STORES } from '../utils/offlineStorage';

// Define pattern types
type PatternType = 'navigation' | 'action' | 'view';

// Define a pattern interface
interface Pattern {
  type: PatternType;
  source: string;
  target: string;
  count: number;
  lastTriggered: string;
}

// Hook interface
interface PredictivePreloadOptions {
  enabled?: boolean;
  threshold?: number;
  maxPatterns?: number;
  trackingEnabled?: boolean;
}

export function usePredictivePreload(
  currentPage: string,
  options: PredictivePreloadOptions = {}
) {
  // Set defaults for options
  const {
    enabled = true,
    threshold = 2,
    maxPatterns = 10,
    trackingEnabled = true
  } = options;

  // Previous page/action tracking
  const [previousPage, setPreviousPage] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Store navigation patterns in local storage
  const [patterns, setPatterns] = useLocalStorage<Pattern[]>('nesttask_user_patterns', []);
  
  // User behavior tracking - record transitions between pages
  useEffect(() => {
    if (!trackingEnabled || !currentPage || currentPage === previousPage) return;
    
    // Skip the first render
    if (!isInitialized) {
      setIsInitialized(true);
      setPreviousPage(currentPage);
      return;
    }
    
    if (previousPage) {
      // Record transition from previous to current page
      updatePattern('navigation', previousPage, currentPage);
    }
    
    setPreviousPage(currentPage);
  }, [currentPage, previousPage, trackingEnabled, isInitialized]);
  
  // Core function to update pattern counts
  const updatePattern = useCallback((
    type: PatternType,
    source: string,
    target: string
  ) => {
    setPatterns(prev => {
      // Look for an existing pattern
      const existingIndex = prev.findIndex(
        p => p.type === type && p.source === source && p.target === target
      );
      
      if (existingIndex >= 0) {
        // Update existing pattern
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          count: updated[existingIndex].count + 1,
          lastTriggered: new Date().toISOString()
        };
        return updated;
      } else {
        // Add new pattern, respecting the max patterns limit
        const newPattern: Pattern = {
          type,
          source,
          target,
          count: 1,
          lastTriggered: new Date().toISOString()
        };
        
        // If we've reached the max patterns, remove the least common one
        if (prev.length >= maxPatterns) {
          const sorted = [...prev].sort((a, b) => a.count - b.count);
          return [...sorted.slice(1), newPattern];
        }
        
        return [...prev, newPattern];
      }
    });
  }, [setPatterns, maxPatterns]);
  
  // Calculate predicted next pages from current page
  const predictedPages = useMemo(() => {
    if (!currentPage || !enabled) return [];
    
    return patterns
      .filter(p => p.type === 'navigation' && p.source === currentPage && p.count >= threshold)
      .sort((a, b) => b.count - a.count)
      .map(p => p.target);
  }, [currentPage, patterns, enabled, threshold]);
  
  // Handle data preloading when predictions change
  useEffect(() => {
    if (!enabled || predictedPages.length === 0 || !navigator.onLine) return;
    
    console.debug('Predictive preloading for pages:', predictedPages);
    
    // Preload data for predicted pages
    predictedPages.forEach(page => {
      // Different preloading strategies based on page type
      if (page === 'home') {
        prefetchApiData(
          'tasks',
          (query) => query.select('*').order('due_date', { ascending: true }).limit(10),
          'home_tasks',
          STORES.TASKS
        );
      } else if (page === 'upcoming') {
        prefetchApiData(
          'tasks',
          (query) => query.select('*').order('due_date', { ascending: true }).limit(20),
          'upcoming_tasks',
          STORES.TASKS
        );
      } else if (page === 'routine') {
        prefetchApiData(
          'routines',
          (query) => query.select('*').eq('isActive', true).limit(1),
          'active_routine',
          STORES.ROUTINES
        );
      } else if (page === 'courses') {
        prefetchApiData(
          'courses',
          (query) => query.select('*').limit(10),
          'courses',
          STORES.COURSES
        );
      } else if (page === 'study-materials') {
        prefetchApiData(
          'materials',
          (query) => query.select('*').limit(10),
          'materials',
          STORES.MATERIALS
        );
      } else if (page === 'notifications') {
        prefetchApiData(
          'notifications',
          (query) => query.select('*').eq('read', false).limit(10),
          'unread_notifications',
          STORES.USER_DATA
        );
      }
    });
  }, [predictedPages, enabled]);
  
  // Record a custom action (like clicking a specific button)
  const recordAction = useCallback((actionSource: string, actionTarget: string) => {
    if (!trackingEnabled) return;
    updatePattern('action', actionSource, actionTarget);
  }, [trackingEnabled, updatePattern]);
  
  // Record a view (like viewing a specific task details)
  const recordView = useCallback((viewSource: string, viewTarget: string) => {
    if (!trackingEnabled) return;
    updatePattern('view', viewSource, viewTarget);
  }, [trackingEnabled, updatePattern]);
  
  // Clear all recorded patterns
  const clearPatterns = useCallback(() => {
    setPatterns([]);
  }, [setPatterns]);
  
  return {
    predictedPages,
    recordAction,
    recordView,
    clearPatterns,
    patterns
  };
} 