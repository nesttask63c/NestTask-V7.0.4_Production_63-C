import { supabase } from '../lib/supabase';
import { getCachedResponse, cacheResponse } from './instantCache';

// Set cache TTL
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Define supported filter types
type FilterType = 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'like' | 'ilike' | 'in' | 'is';

// Cache parameters type
interface CacheOptions {
  cacheName?: string;
  ttl?: number;
  skipCache?: boolean;
  forceFresh?: boolean;
}

// Query parameters with proper typing
interface QueryParams {
  select?: string;
  eq?: Record<string, any>;
  order?: Record<string, { ascending?: boolean; nullsFirst?: boolean }>;
  limit?: number;
  filter?: Partial<Record<FilterType, Record<string, any>>>;
  [key: string]: any;
}

// Generate a cache key from table name and query parameters
function generateCacheKey(table: string, queryParams: QueryParams): string {
  const paramsString = Object.entries(queryParams || {})
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
    .join('&');
  
  return `supabase:${table}${paramsString ? `?${paramsString}` : ''}`;
}

/**
 * Instant cached read from Supabase that uses cached data for immediate display
 * while refreshing in the background
 * 
 * @param table Supabase table name
 * @param queryParams Query parameters
 * @param options Cache options
 * @returns Promise with data, error, and isFromCache flag
 */
export async function instantRead(
  table: string,
  queryParams: QueryParams = {},
  options: CacheOptions = {}
) {
  const {
    cacheName = 'supabase-cache',
    ttl = CACHE_TTL,
    skipCache = false,
    forceFresh = false
  } = options;
  
  const cacheKey = generateCacheKey(table, queryParams);
  let isFromCache = false;
  
  // Try to get from cache first unless forceFresh is true
  if (!skipCache && !forceFresh && 'caches' in window) {
    try {
      const cachedResponse = await getCachedResponse(cacheKey, cacheName);
      
      if (cachedResponse) {
        const { data, timestamp } = await cachedResponse.json();
        
        if (data && Date.now() - timestamp < ttl) {
          isFromCache = true;
          
          // Update in background if online
          if (navigator.onLine) {
            refreshInBackground(table, queryParams, cacheName);
          }
          
          return { data, error: null, isFromCache };
        }
      }
    } catch (err) {
      console.warn('Error reading from cache:', err);
    }
  }
  
  // If we get here, we either don't have a cache hit or forceFresh is true
  try {
    // Start building the query
    let query = supabase.from(table).select('*');
    
    // Apply query modifiers if provided
    if (queryParams.select) {
      query = supabase.from(table).select(queryParams.select);
    }
    
    if (queryParams.eq) {
      Object.entries(queryParams.eq).forEach(([column, value]) => {
        query = query.eq(column, value as string);
      });
    }
    
    if (queryParams.order) {
      Object.entries(queryParams.order).forEach(([column, config]) => {
        query = query.order(column, config);
      });
    }
    
    if (queryParams.limit) {
      query = query.limit(queryParams.limit);
    }
    
    if (queryParams.filter) {
      Object.entries(queryParams.filter).forEach(([filterType, config]) => {
        // Type-safe way to handle dynamic filter methods
        const validFilterTypes: FilterType[] = ['eq', 'neq', 'gt', 'lt', 'gte', 'lte', 'like', 'ilike', 'in', 'is'];
        
        if (validFilterTypes.includes(filterType as FilterType) && config) {
          Object.entries(config).forEach(([column, value]) => {
            // Apply the filter method if it exists on the query
            switch (filterType as FilterType) {
              case 'eq':
                query = query.eq(column, value);
                break;
              case 'neq':
                query = query.neq(column, value);
                break;
              case 'gt':
                query = query.gt(column, value);
                break;
              case 'lt':
                query = query.lt(column, value);
                break;
              case 'gte':
                query = query.gte(column, value);
                break;
              case 'lte':
                query = query.lte(column, value);
                break;
              case 'like':
                query = query.like(column, value as string);
                break;
              case 'ilike':
                query = query.ilike(column, value as string);
                break;
              case 'in':
                query = query.in(column, value as any[]);
                break;
              case 'is':
                query = query.is(column, value as boolean | null);
                break;
            }
          });
        }
      });
    }
    
    // Execute the query
    const { data, error } = await query;
    
    if (!error && data && 'caches' in window && !skipCache) {
      // Cache the successful response
      const responseData = {
        data,
        timestamp: Date.now()
      };
      
      const response = new Response(JSON.stringify(responseData), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'max-age=300'
        }
      });
      
      await cacheResponse(cacheKey, response, cacheName);
    }
    
    return { data, error, isFromCache };
  } catch (err) {
    console.error('Error fetching from Supabase:', err);
    return { data: null, error: err, isFromCache };
  }
}

/**
 * Refresh data in the background without blocking UI
 */
async function refreshInBackground(
  table: string,
  queryParams: QueryParams = {},
  cacheName: string
) {
  setTimeout(async () => {
    try {
      await instantRead(table, queryParams, { 
        cacheName, 
        forceFresh: true,
        skipCache: false
      });
    } catch (err) {
      console.warn('Background refresh failed:', err);
    }
  }, 0);
}

/**
 * Clear the Supabase cache for a specific table or all tables
 * @param table Optional table name to clear cache for
 * @param cacheName Cache name
 */
export async function clearCache(
  table?: string,
  cacheName: string = 'supabase-cache'
) {
  if (!('caches' in window)) return;
  
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    
    if (table) {
      // Clear cache for specific table
      const tableKeys = keys.filter(key => 
        key.url.includes(`supabase:${table}`)
      );
      
      await Promise.all(tableKeys.map(key => cache.delete(key)));
    } else {
      // Clear all Supabase cache
      await Promise.all(keys.map(key => cache.delete(key)));
    }
  } catch (err) {
    console.error('Error clearing cache:', err);
  }
} 