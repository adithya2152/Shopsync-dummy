// PWA initialization utilities

import { registerServiceWorker, requestNotificationPermission } from './pwaUtils';

export async function initializePWA() {
  console.log('Initializing PWA features...');

  // Register service worker
  const registration = await registerServiceWorker();
  
  if (registration) {
    console.log('Service Worker registered successfully');
    
    // Request notification permission after a delay
    setTimeout(async () => {
      const permission = await requestNotificationPermission();
      console.log('Notification permission:', permission);
    }, 5000);
  }

  // Initialize background sync if supported
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    console.log('Background Sync supported');
  }

  // Initialize push notifications if supported
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    console.log('Push Notifications supported');
  }

  // Add to home screen prompt handling
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    console.log('Install prompt available');
  });

  // App installed event
  window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
  });

  // Handle app updates
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('New service worker activated');
    });
  }

  // Detect if running as PWA
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in window.navigator && (window.navigator as Navigator & { standalone?: boolean }).standalone === true);
  
  if (isStandalone) {
    console.log('Running as installed PWA');
    document.body.classList.add('pwa-installed');
  }

  // Handle network status changes
  window.addEventListener('online', () => {
    console.log('Back online');
    document.body.classList.remove('offline');
    document.body.classList.add('online');
  });

  window.addEventListener('offline', () => {
    console.log('Gone offline');
    document.body.classList.remove('online');
    document.body.classList.add('offline');
  });

  console.log('PWA initialization complete');
}