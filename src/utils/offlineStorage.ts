// // Offline storage utilities using IndexedDB

// interface OfflineData {
//   id?: number;
//   key: string;
//   data: any;
//   timestamp: number;
//   expiresAt?: number;
// }

// class OfflineStorage {
//   private dbName = 'shopsync-offline-storage';
//   private version = 1;
//   private db: IDBDatabase | null = null;

//   async init(): Promise<void> {
//     return new Promise((resolve, reject) => {
//       const request = indexedDB.open(this.dbName, this.version);
      
//       request.onerror = () => reject(request.error);
//       request.onsuccess = () => {
//         this.db = request.result;
//         resolve();
//       };
      
//       request.onupgradeneeded = (event) => {
//         const db = (event.target as IDBOpenDBRequest).result;
        
//         // Create stores
//         if (!db.objectStoreNames.contains('cache')) {
//           const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
//           cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
//         }
        
//         if (!db.objectStoreNames.contains('queue')) {
//           db.createObjectStore('queue', { keyPath: 'id', autoIncrement: true });
//         }
        
//         if (!db.objectStoreNames.contains('user-data')) {
//           db.createObjectStore('user-data', { keyPath: 'key' });
//         }
//       };
//     });
//   }

//   async set(key: string, data: any, ttl?: number): Promise<void> {
//     if (!this.db) await this.init();
    
//     const transaction = this.db!.transaction(['cache'], 'readwrite');
//     const store = transaction.objectStore('cache');
    
//     const item: OfflineData = {
//       key,
//       data,
//       timestamp: Date.now(),
//       expiresAt: ttl ? Date.now() + ttl : undefined,
//     };
    
//     await store.put(item);
//   }

//   async get(key: string): Promise<any | null> {
//     if (!this.db) await this.init();
    
//     const transaction = this.db!.transaction(['cache'], 'readonly');
//     const store = transaction.objectStore('cache');
//     const result = await store.get(key);
    
//     if (!result) return null;
    
//     // Check if expired
//     if (result.expiresAt && Date.now() > result.expiresAt) {
//       await this.delete(key);
//       return null;
//     }
    
//     return result.data;
//   }

//   async delete(key: string): Promise<void> {
//     if (!this.db) await this.init();
    
//     const transaction = this.db!.transaction(['cache'], 'readwrite');
//     const store = transaction.objectStore('cache');
//     await store.delete(key);
//   }

//   async clear(): Promise<void> {
//     if (!this.db) await this.init();
    
//     const transaction = this.db!.transaction(['cache'], 'readwrite');
//     const store = transaction.objectStore('cache');
//     await store.clear();
//   }

//   async addToQueue(action: string, data: any): Promise<void> {
//     if (!this.db) await this.init();
    
//     const transaction = this.db!.transaction(['queue'], 'readwrite');
//     const store = transaction.objectStore('queue');
    
//     await store.add({
//       action,
//       data,
//       timestamp: Date.now(),
//     });
//   }

//   async getQueue(): Promise<any[]> {
//     if (!this.db) await this.init();
    
//     const transaction = this.db!.transaction(['queue'], 'readonly');
//     const store = transaction.objectStore('queue');
//     return await store.getAll();
//   }

//   async clearQueue(): Promise<void> {
//     if (!this.db) await this.init();
    
//     const transaction = this.db!.transaction(['queue'], 'readwrite');
//     const store = transaction.objectStore('queue');
//     await store.clear();
//   }

//   // User data methods (for offline user preferences, cart, etc.)
//   async setUserData(key: string, data: any): Promise<void> {
//     if (!this.db) await this.init();
    
//     const transaction = this.db!.transaction(['user-data'], 'readwrite');
//     const store = transaction.objectStore('user-data');
    
//     await store.put({ key, data, timestamp: Date.now() });
//   }

//   async getUserData(key: string): Promise<any | null> {
//     if (!this.db) await this.init();
    
//     const transaction = this.db!.transaction(['user-data'], 'readonly');
//     const store = transaction.objectStore('user-data');
//     const result = await store.get(key);
    
//     return result ? result.data : null;
//   }
// }

// export const offlineStorage = new OfflineStorage();

// Offline storage utilities using IndexedDB

// 1. Define strongly-typed interfaces for data in each object store.
// Using generics `<T>` allows us to store any kind of data while maintaining type safety.

interface OfflineCacheItem<T> {
  key: string;
  data: T;
  timestamp: number;
  expiresAt?: number;
}

interface OfflineQueueItem<T> {
  id?: number; // This is the keyPath and is auto-incremented
  action: string;
  data: T;
  timestamp: number;
}

interface UserDataItem<T> {
  key: string;
  data: T;
  timestamp: number;
}

// Define the names of our object stores for type-safe access
type StoreName = 'cache' | 'queue' | 'user-data';

class OfflineStorage {
  private dbName = 'shopsync-offline-storage';
  private version = 1;
  private db: IDBDatabase | null = null;

  // 2. Promisify IndexedDB requests to work seamlessly with async/await.
  // IndexedDB's API is event-based, so we wrap requests in Promises.
  private promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Ensures the database connection is open before any operation.
  private async getDB(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db;
    }
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('cache')) {
          const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
          cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('queue')) {
          db.createObjectStore('queue', { keyPath: 'id', autoIncrement: true });
        }
        
        if (!db.objectStoreNames.contains('user-data')) {
          db.createObjectStore('user-data', { keyPath: 'key' });
        }
      };
    });
  }

  // Helper to create a transaction and get a store
  private async getStore(storeName: StoreName, mode: IDBTransactionMode): Promise<IDBObjectStore> {
    const db = await this.getDB();
    const transaction = db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  // --- Cache Store Methods ---

  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    const store = await this.getStore('cache', 'readwrite');
    const item: OfflineCacheItem<T> = {
      key,
      data,
      timestamp: Date.now(),
      expiresAt: ttl ? Date.now() + ttl : undefined,
    };
    await this.promisifyRequest(store.put(item));
  }

  async get<T>(key: string): Promise<T | null> {
    const store = await this.getStore('cache', 'readonly');
    const result = await this.promisifyRequest(store.get(key) as IDBRequest<OfflineCacheItem<T> | undefined>);
    
    if (!result) {
      return null;
    }
    
    // Check if the item has expired
    if (result.expiresAt && Date.now() > result.expiresAt) {
      // Item is expired, delete it and return null
      await this.delete(key);
      return null;
    }
    
    return result.data;
  }

  async delete(key: string): Promise<void> {
    const store = await this.getStore('cache', 'readwrite');
    await this.promisifyRequest(store.delete(key));
  }

  async clearCache(): Promise<void> {
    const store = await this.getStore('cache', 'readwrite');
    await this.promisifyRequest(store.clear());
  }

  // --- Queue Store Methods ---

  async addToQueue<T>(action: string, data: T): Promise<void> {
    const store = await this.getStore('queue', 'readwrite');
    const item: Omit<OfflineQueueItem<T>, 'id'> = {
      action,
      data,
      timestamp: Date.now(),
    };
    await this.promisifyRequest(store.add(item));
  }

  async getQueue<T>(): Promise<OfflineQueueItem<T>[]> {
    const store = await this.getStore('queue', 'readonly');
    return this.promisifyRequest(store.getAll() as IDBRequest<OfflineQueueItem<T>[]>);
  }

  async clearQueue(): Promise<void> {
    const store = await this.getStore('queue', 'readwrite');
    await this.promisifyRequest(store.clear());
  }

  // --- User-Data Store Methods ---

  async setUserData<T>(key: string, data: T): Promise<void> {
    const store = await this.getStore('user-data', 'readwrite');
    const item: UserDataItem<T> = { key, data, timestamp: Date.now() };
    await this.promisifyRequest(store.put(item));
  }

  async getUserData<T>(key: string): Promise<T | null> {
    const store = await this.getStore('user-data', 'readonly');
    const result = await this.promisifyRequest(store.get(key) as IDBRequest<UserDataItem<T> | undefined>);
    return result ? result.data : null;
  }
}

// Export a singleton instance for easy use across the application
export const offlineStorage = new OfflineStorage();