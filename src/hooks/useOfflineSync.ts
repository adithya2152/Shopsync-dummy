"use client";

import { useState, useEffect, useCallback } from 'react';
import { offlineStorage } from '@/utils/offlineStorage';
import { useNetworkStatus } from './useNetworkStatus';

interface QueuedAction {
  id?: number;
  action: string;
  data: unknown;
  timestamp: number;
}

export function useOfflineSync() {
  const [queuedActions, setQueuedActions] = useState<QueuedAction[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const { isOnline } = useNetworkStatus();

  // Load queued actions on mount
  useEffect(() => {
    const loadQueue = async () => {
      try {
        const queue = await offlineStorage.getQueue();
        setQueuedActions(queue);
      } catch (error) {
        console.error('Failed to load offline queue:', error);
      }
    };

    loadQueue();
  }, []);

  const syncQueuedActions = useCallback(async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    
    try {
      const queue = await offlineStorage.getQueue();
      
      for (const queuedAction of queue) {
        try {
          await processQueuedAction(queuedAction);
        } catch (error) {
          console.error('Failed to process queued action:', error);
          // Keep failed actions in queue for retry
          continue;
        }
      }
      
      // Clear successfully processed actions
      await offlineStorage.clearQueue();
      setQueuedActions([]);
      
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing]);

  // Sync when coming back online
  useEffect(() => {
    if (isOnline && queuedActions.length > 0) {
      syncQueuedActions();
    }
  }, [isOnline, queuedActions.length , syncQueuedActions]);

  const addToQueue = useCallback(async (action: string, data: unknown) => {
    try {
      await offlineStorage.addToQueue(action, data);
      const updatedQueue = await offlineStorage.getQueue();
      setQueuedActions(updatedQueue);
    } catch (error) {
      console.error('Failed to add action to queue:', error);
    }
  }, []);

  const processQueuedAction = async (queuedAction: QueuedAction) => {
    const { action, data } = queuedAction;
    
    switch (action) {
      case 'place_order':
        await fetch('/api/place_order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        break;
        
      case 'add_rating':
        await fetch('/api/add_rating', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        break;
        
      case 'update_profile':
        await fetch('/api/user_settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        break;
        
      default:
        console.warn('Unknown queued action:', action);
    }
  };

  return {
    queuedActions,
    isSyncing,
    addToQueue,
    syncQueuedActions,
  };
}