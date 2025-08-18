"use client";

import { useState, useEffect } from 'react';
import {
  Snackbar,
  Alert,
  Box,
  Typography,
  Button,
} from '@mui/material';
import {
  WifiOff as OfflineIcon,
  Wifi as OnlineIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);
  const [showOnlineMessage, setShowOnlineMessage] = useState(false);

  useEffect(() => {
    // Set initial online status
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineMessage(false);
      setShowOnlineMessage(true);
      
      // Hide online message after 3 seconds
      setTimeout(() => {
        setShowOnlineMessage(false);
      }, 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOnlineMessage(false);
      setShowOfflineMessage(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <>
      {/* Offline Indicator */}
      <Snackbar
        open={showOfflineMessage}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ mt: 8 }}
      >
        <Alert
          severity="warning"
          sx={{
            width: '100%',
            borderRadius: 2,
            background: 'linear-gradient(145deg, rgba(255, 152, 0, 0.95), rgba(255, 152, 0, 0.85))',
            backdropFilter: 'blur(10px)',
            color: 'white',
          }}
          icon={<OfflineIcon />}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={handleRefresh}
              startIcon={<RefreshIcon />}
            >
              Retry
            </Button>
          }
        >
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
              You&apos;re offline
            </Typography>
            <Typography variant="body2">
              Some features may not work. Check your connection.
            </Typography>
          </Box>
        </Alert>
      </Snackbar>

      {/* Back Online Indicator */}
      <Snackbar
        open={showOnlineMessage}
        autoHideDuration={3000}
        onClose={() => setShowOnlineMessage(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ mt: 8 }}
      >
        <Alert
          severity="success"
          sx={{
            width: '100%',
            borderRadius: 2,
            background: 'linear-gradient(145deg, rgba(76, 175, 80, 0.95), rgba(76, 175, 80, 0.85))',
            backdropFilter: 'blur(10px)',
            color: 'white',
          }}
          icon={<OnlineIcon />}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            You&apos;re back online!
          </Typography>
        </Alert>
      </Snackbar>

      {/* Persistent offline banner */}
      {!isOnline && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(90deg, #ff9800, #f57c00)',
            color: 'white',
            py: 1,
            px: 2,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
          }}
        >
          <OfflineIcon fontSize="small" />
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            Offline Mode - Limited functionality available
          </Typography>
        </Box>
      )}
    </>
  );
}