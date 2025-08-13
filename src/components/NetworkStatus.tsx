"use client";

import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { Alert, Snackbar, Slide } from '@mui/material';
import { useState, useEffect } from 'react';

export default function NetworkStatus() {
  const { isOnline, wasOffline } = useNetworkStatus();
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);
  const [showOnlineAlert, setShowOnlineAlert] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShowOfflineAlert(true);
    } else {
      setShowOfflineAlert(false);
      if (wasOffline) {
        setShowOnlineAlert(true);
        setTimeout(() => setShowOnlineAlert(false), 3000);
      }
    }
  }, [isOnline, wasOffline]);

  return (
    <>
      {/* Offline Alert */}
      <Snackbar
        open={showOfflineAlert}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        TransitionComponent={Slide}
      >
        <Alert severity="warning" variant="filled">
          You're offline. Some features may be limited.
        </Alert>
      </Snackbar>

      {/* Back Online Alert */}
      <Snackbar
        open={showOnlineAlert}
        autoHideDuration={3000}
        onClose={() => setShowOnlineAlert(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        TransitionComponent={Slide}
      >
        <Alert severity="success" variant="filled">
          Connection restored! You're back online.
        </Alert>
      </Snackbar>
    </>
  );
}