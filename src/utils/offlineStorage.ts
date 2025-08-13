// Utility functions for offline data management

interface OfflineOrder {
  id: string;
  cart: any[];
  shopId: number;
  address: any;
  paymentMethod: string;
  coupon?: string;
  timestamp: number;
}

interface OfflineData {
  orders: OfflineOrder[];
  lastSync: number;
}

const OFFLINE_STORAGE_KEY = 'shopsync-offline-data';

export class OfflineStorageManager {
  private static instance: OfflineStorageManager;
  
  static getInstance(): OfflineStorageManager {
    if (!OfflineStorageManager.instance) {
      OfflineStorageManager.instance = new OfflineStorageManager();
    }
    return OfflineStorageManager.instance;
  }

  private getOfflineData(): OfflineData {
    try {
      const data = localStorage.getItem(OFFLINE_STORAGE_KEY);
      return data ? JSON.parse(data) : { orders: [], lastSync: 0 };
    } catch (error) {
      console.error('Error reading offline data:', error);
      return { orders: [], lastSync: 0 };
    }
  }

  private saveOfflineData(data: OfflineData): void {
    try {
      localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving offline data:', error);
    }
  }

  // Store an order for later sync
  storeOfflineOrder(order: Omit<OfflineOrder, 'id' | 'timestamp'>): string {
    const data = this.getOfflineData();
    const offlineOrder: OfflineOrder = {
      ...order,
      id: `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };
    
    data.orders.push(offlineOrder);
    this.saveOfflineData(data);
    
    return offlineOrder.id;
  }

  // Get all pending offline orders
  getOfflineOrders(): OfflineOrder[] {
    return this.getOfflineData().orders;
  }

  // Remove an order after successful sync
  removeOfflineOrder(orderId: string): void {
    const data = this.getOfflineData();
    data.orders = data.orders.filter(order => order.id !== orderId);
    this.saveOfflineData(data);
  }

  // Clear all offline orders
  clearOfflineOrders(): void {
    const data = this.getOfflineData();
    data.orders = [];
    data.lastSync = Date.now();
    this.saveOfflineData(data);
  }

  // Get count of pending orders
  getPendingOrdersCount(): number {
    return this.getOfflineData().orders.length;
  }

  // Check if there are pending orders
  hasPendingOrders(): boolean {
    return this.getPendingOrdersCount() > 0;
  }

  // Update last sync timestamp
  updateLastSync(): void {
    const data = this.getOfflineData();
    data.lastSync = Date.now();
    this.saveOfflineData(data);
  }

  // Get last sync timestamp
  getLastSync(): number {
    return this.getOfflineData().lastSync;
  }
}

// Export singleton instance
export const offlineStorage = OfflineStorageManager.getInstance();