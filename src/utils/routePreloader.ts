import { prefetchResources } from './prefetch';

// Import functions for each page
const importAdminDashboard = () => import('../pages/AdminDashboard').then(module => ({ default: module.AdminDashboard }));
const importUpcomingPage = () => import('../pages/UpcomingPage').then(module => ({ default: module.UpcomingPage }));
const importSearchPage = () => import('../pages/SearchPage').then(module => ({ default: module.SearchPage }));
const importNotificationsPage = () => import('../pages/NotificationsPage').then(module => ({ default: module.NotificationsPage }));
const importCoursePage = () => import('../pages/CoursePage').then(module => ({ default: module.CoursePage }));
const importStudyMaterialsPage = () => import('../pages/StudyMaterialsPage').then(module => ({ default: module.StudyMaterialsPage }));
const importRoutinePage = () => import('../pages/RoutinePage').then(module => ({ default: module.RoutinePage }));

// Map of route keys to import functions
const routeImports = {
  'admin': importAdminDashboard,
  'upcoming': importUpcomingPage,
  'search': importSearchPage,
  'notifications': importNotificationsPage,
  'courses': importCoursePage,
  'study-materials': importStudyMaterialsPage,
  'routine': importRoutinePage
};

// Complete list of all possible app routes for refresh handling
export const APP_ROUTES = [
  'home',
  'admin',
  'upcoming',
  'search',
  'notifications',
  'courses',
  'study-materials',
  'routine',
  'settings',
  'profile'
];

/**
 * Preload routes based on predicted navigation paths
 * @param predictedRoutes Array of predicted route keys
 * @param limit Maximum number of routes to preload
 */
export function preloadPredictedRoutes(predictedRoutes: string[], limit = 2) {
  if (!Array.isArray(predictedRoutes) || predictedRoutes.length === 0 || !navigator.onLine) {
    return;
  }
  
  // Limit the number of routes to preload
  const routesToPreload = predictedRoutes.slice(0, limit);
  
  // Map routes to prefetch resources
  const resources = routesToPreload
    .map(route => {
      const importFn = routeImports[route as keyof typeof routeImports];
      
      if (!importFn) return null;
      
      return {
        type: 'route' as const,
        key: route,
        loader: importFn,
        options: { priority: 'high' as const }
      };
    })
    .filter(Boolean) as Array<{
      type: 'route';
      key: string;
      loader: () => Promise<any>;
      options: { priority: 'high' };
    }>;
  
  // Prefetch resources if any
  if (resources.length > 0) {
    prefetchResources(resources);
    console.debug(`Preloaded predicted routes: ${routesToPreload.join(', ')}`);
  }
}

/**
 * Preload a specific route directly
 * @param route Route key to preload
 */
export function preloadRoute(route: string) {
  const importFn = routeImports[route as keyof typeof routeImports];
  
  if (!importFn || !navigator.onLine) {
    return;
  }
  
  prefetchResources([{
    type: 'route' as const,
    key: route,
    loader: importFn,
    options: { priority: 'high' as const }
  }]);
  
  console.debug(`Preloaded route: ${route}`);
}

/**
 * Check if a URL path matches an app route
 * Useful for handling page refreshes
 * @param path URL path to check
 * @returns True if the path matches an app route
 */
export function isAppRoute(path: string): boolean {
  if (!path || path === '/' || path === '/index.html') {
    return true; // Home route
  }
  
  // Remove leading slash and any trailing slashes/query params
  const normalizedPath = path.replace(/^\/+/, '').split('/')[0].split('?')[0];
  
  return APP_ROUTES.includes(normalizedPath);
} 