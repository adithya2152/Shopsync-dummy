"use client";

import { useState, useEffect } from 'react';
import { Chip, Badge } from '@mui/material';
import { CloudOff, Sync } from '@mui/icons-material';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { offlineStorage } from '@/utils/offlineStorage';

export default function OfflineIndicator() {
  const { isOnline } = useNetworkStatus();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const updatePendingCount = () => {
      setPendingCount(offlineStorage.getPendingOrdersCount());
    };

    updatePendingCount();
    
    // Update count periodically
    const interval = setInterval(updatePendingCount, 5000);
    
    return () => clearInterval(interval);
  }, []);

  if (isOnline && pendingCount === 0) {
    return null;
  }

  return (
    <div style={{ position: 'fixed', top: 80, right: 16, zIndex: 1000 }}>
      {!isOnline && (
        <Chip
          icon={<CloudOff />}
          label="Offline"
          color="warning"
          variant="filled"
          sx={{ mb: 1 }}
        />
      )}
      
      {pendingCount > 0 && (
        <Badge badgeContent={pendingCount} color="error">
          <Chip
            icon={<Sync />}
            label="Syncing..."
            color="info"
            variant="filled"
          />
        </Badge>
      )}
    </div>
  );
}