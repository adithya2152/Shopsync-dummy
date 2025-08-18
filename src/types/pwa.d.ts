 
declare global {
  interface Window {
    workbox?: {
      addEventListener: (type: string, listener: (event: Event) => void) => void;
      messageSkipWaiting: () => void;
    };
  }
}

export {};