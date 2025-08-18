"use client";

import { useState, useEffect } from 'react';

// 1. Define the possible values for the connection's effective type
type EffectiveConnectionType = 'slow-2g' | '2g' | '3g' | '4g';

// 2. Define the type for the Network Information API object
// This interface extends EventTarget because we use addEventListener on it.
interface NetworkInformation extends EventTarget {
  readonly effectiveType: EffectiveConnectionType;
  // Other properties can be added here if needed, e.g., downlink, rtt
}

// 3. Extend the global Navigator interface to include the connection property
// This avoids the need to cast `navigator` to `any`.
declare global {
  interface Navigator {
    readonly connection?: NetworkInformation;
    readonly mozConnection?: NetworkInformation; // For older Firefox
    readonly webkitConnection?: NetworkInformation; // For older WebKit browsers
  }
}

export function useNetworkStatus() {
  // State is now typed more specifically
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [connectionType, setConnectionType] = useState<EffectiveConnectionType | 'unknown'>('unknown');

  useEffect(() => {
    // Set initial online status if navigator is available
    if (typeof navigator !== 'undefined') {
      setIsOnline(navigator.onLine);
    }
    
    // Check for the connection property on navigator
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

    const updateConnectionType = () => {
      if (connection) {
        setConnectionType(connection.effectiveType);
      }
    };

    updateConnectionType(); // Set initial connection type

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Set up event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    connection?.addEventListener('change', updateConnectionType);

    // Cleanup function to remove event listeners
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      connection?.removeEventListener('change', updateConnectionType);
    };
  }, []);

  return { isOnline, connectionType };
}