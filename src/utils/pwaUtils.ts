// PWA utility functions

/**
 * Interface for the `beforeinstallprompt` event.
 */
export interface PWAInstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
}

// Check if the app is running in standalone mode (installed)
export function isStandalone(): boolean {
  // `standalone` is a non-standard property for older iOS devices
  interface NavigatorStandalone extends Navigator {
    standalone?: boolean;
  }
  const isLegacyIOS = 'standalone' in window.navigator && (window.navigator as NavigatorStandalone).standalone === true;
  return window.matchMedia('(display-mode: standalone)').matches || isLegacyIOS;
}

// Check if the device is iOS
export function isIOS(): boolean {
  // Additional checks can be added for modern iPads
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

// Check if the device is Android
export function isAndroid(): boolean {
  return /Android/.test(navigator.userAgent);
}

// Get device type
export function getDeviceType(): 'ios' | 'android' | 'desktop' | 'unknown' {
  if (isIOS()) return 'ios';
  if (isAndroid()) return 'android';
  // A simple check for common desktop user agents
  if (/(Windows|Mac|Linux)/.test(navigator.userAgent)) return 'desktop';
  return 'unknown';
}

// Check if PWA features are supported
export function isPWASupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'caches' in window;
}

// Register service worker
export async function registerServiceWorker(swPath: string = '/sw.js'): Promise<ServiceWorkerRegistration | null> {
  if (!isPWASupported()) {
    console.warn('PWA features (Service Worker) are not supported in this browser.');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register(swPath);
    console.log('✅ Service Worker registered successfully:', registration.scope);
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}

// Request notification permission
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('Notifications are not supported in this browser.');
    return 'denied';
  }
  // No need to request if permission is already decided
  if (Notification.permission !== 'default') {
    return Notification.permission;
  }
  return await Notification.requestPermission();
}

// Show local notification
export function showNotification(title: string, options?: NotificationOptions) {
  if (Notification.permission === 'granted') {
    // Best practice to show notification from a service worker,
    // but this is the client-side implementation.
    new Notification(title, {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      ...options,
    });
  }
}

// --- Cache Management Utilities ---
export class CacheManager {
  private cacheName: string;

  constructor(cacheName: string = 'shopsync-dynamic') {
    this.cacheName = cacheName;
  }

  async addToCache(request: RequestInfo | URL, response: Response): Promise<void> {
    const cache = await caches.open(this.cacheName);
    await cache.put(request, response);
  }

  async getFromCache(request: RequestInfo | URL): Promise<Response | undefined> {
    const cache = await caches.open(this.cacheName);
    return cache.match(request);
  }

  async removeFromCache(request: RequestInfo | URL): Promise<boolean> {
    const cache = await caches.open(this.cacheName);
    return cache.delete(request);
  }

  async clearCache(): Promise<void> {
    await caches.delete(this.cacheName);
    console.log(`Cache "${this.cacheName}" has been cleared.`);
  }

  async getCacheSize(): Promise<number> {
    const cache = await caches.open(this.cacheName);
    const keys = await cache.keys();
    return keys.length;
  }
}

// --- Offline Queue for Failed Requests ---

/**
 * @interface QueuedRequest
 * Defines the structure of a request object stored in IndexedDB.
 * We store a serializable version of the request options.
 */
interface QueuedRequest {
  id: number; // The auto-incremented primary key from IndexedDB
  url: string;
  options: {
    method?: string;
    headers?: Record<string, string>; // Headers are stored as a plain object
    body?: BodyInit | null;
  };
  timestamp: number;
}

export class OfflineQueue {
  private dbName = 'shopsync-offline';
  private storeName = 'requests';
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;
  
  // Promisify IndexedDB requests for async/await compatibility
  private promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private init(): Promise<void> {
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true });
        }
      };
    });
    return this.initPromise;
  }
  
  private async getStore(mode: IDBTransactionMode): Promise<IDBObjectStore> {
    await this.init();
    const transaction = this.db!.transaction(this.storeName, mode);
    return transaction.objectStore(this.storeName);
  }

  async addRequest(url: string, options: RequestInit): Promise<void> {
    const store = await this.getStore('readwrite');
    
    // Headers object is not serializable; convert it to a plain object.
    const serializableHeaders: Record<string, string> = {};
    if (options.headers) {
      new Headers(options.headers).forEach((value, key) => {
        serializableHeaders[key] = value;
      });
    }

    const requestToAdd: Omit<QueuedRequest, 'id'> = {
      url,
      options: {
        method: options.method || 'GET',
        headers: serializableHeaders,
        body: options.body,
      },
      timestamp: Date.now(),
    };
    
    await this.promisifyRequest(store.add(requestToAdd));
    console.log('Request queued for offline processing:', url);
  }

  async processQueue(): Promise<void> {
    await this.init();
    if (!navigator.onLine) return; // Don't process if we are still offline

    const store = await this.getStore('readwrite');
    const requests = await this.promisifyRequest(store.getAll() as IDBRequest<QueuedRequest[]>);

    if (requests.length === 0) return;

    console.log(`Processing ${requests.length} offline requests...`);
    for (const request of requests) {
      try {
        await fetch(request.url, request.options);
        // If fetch is successful, remove the request from the queue
        await this.promisifyRequest(store.delete(request.id));
        console.log('Successfully processed offline request:', request.url);
      } catch (error) {
        console.error('Failed to process offline request, it will be retried later:', error);
      }
    }
  }
}

// --- Singleton Instance and Event Listener ---
export const offlineQueue = new OfflineQueue();

// Process the queue automatically when the network connection is restored
window.addEventListener('online', () => {
  console.log('Network connection restored. Processing offline queue...');
  offlineQueue.processQueue();
});