// Enhanced fetch with offline support and caching

import { offlineStorage } from './offlineStorage';

interface FetchOptions extends RequestInit {
  cache?: 'force-cache' | 'no-cache' | 'default';
  ttl?: number; // Time to live in milliseconds
  fallbackToCache?: boolean;
  queueOnFailure?: boolean;
}

export async function enhancedFetch(
  url: string, 
  options: FetchOptions = {}
): Promise<Response> {
  const {
    cache = 'default',
    ttl = 5 * 60 * 1000, // 5 minutes default
    fallbackToCache = true,
    queueOnFailure = false,
    ...fetchOptions
  } = options;

  const cacheKey = `fetch-${url}-${JSON.stringify(fetchOptions)}`;

  // Force cache strategy
  if (cache === 'force-cache') {
    const cachedData = await offlineStorage.get(cacheKey);
    if (cachedData) {
      return new Response(JSON.stringify(cachedData), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  try {
    // Try network request
    const response = await fetch(url, fetchOptions);
    
    // Cache successful responses
    if (response.ok && cache !== 'no-cache') {
      const clonedResponse = response.clone();
      const data = await clonedResponse.json();
      await offlineStorage.set(cacheKey, data, ttl);
    }
    
    return response;
    
  } catch (error) {
    console.error('Network request failed:', error);
    
    // Try to return cached version
    if (fallbackToCache) {
      const cachedData = await offlineStorage.get(cacheKey);
      if (cachedData) {
        console.log('Returning cached data for:', url);
        return new Response(JSON.stringify(cachedData), {
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            'X-From-Cache': 'true',
          },
        });
      }
    }
    
    // Queue for later if requested
    if (queueOnFailure && fetchOptions.method !== 'GET') {
      await offlineStorage.addToQueue('fetch', { url, options: fetchOptions });
    }
    
    throw error;
  }
}

// Specialized functions for common use cases
export const fetchWithCache = (url: string, ttl?: number) => 
  enhancedFetch(url, { cache: 'default', ttl, fallbackToCache: true });

export const fetchNetworkFirst = (url: string) => 
  enhancedFetch(url, { cache: 'no-cache', fallbackToCache: true });

export const fetchCacheFirst = (url: string, ttl?: number) => 
  enhancedFetch(url, { cache: 'force-cache', ttl });

export const fetchWithOfflineQueue = (url: string, options: RequestInit) => {
  // Map RequestInit.cache to FetchOptions.cache
  let cache: 'default' | 'force-cache' | 'no-cache' | undefined;
  switch (options.cache) {
    case 'force-cache':
      cache = 'force-cache';
      break;
    case 'no-cache':
      cache = 'no-cache';
      break;
    default:
      cache = 'default';
  }
  const {  ...restOptions } = options;
  return enhancedFetch(url, { ...restOptions, cache, queueOnFailure: true });
};