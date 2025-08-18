"use client";

import { useState, useEffect } from 'react';
import {
  Snackbar,
  Alert,
  Button,
  Typography,
  Box,
} from '@mui/material';
import {
  SystemUpdate as UpdateIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

export default function PWAUpdatePrompt() {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // Reload the page when a new service worker takes control
        window.location.reload();
      });

      navigator.serviceWorker.ready.then((registration) => {
        // Check for waiting service worker
        if (registration.waiting) {
          setWaitingWorker(registration.waiting);
          setShowUpdatePrompt(true);
        }

        // Listen for new service worker
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setWaitingWorker(newWorker);
                setShowUpdatePrompt(true);
              }
            });
          }
        });
      });
    }
  }, []);

  const handleUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      setShowUpdatePrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowUpdatePrompt(false);
  };

  return (
    <Snackbar
      open={showUpdatePrompt}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      sx={{ mb: 2 }}
    >
      <Alert
        severity="info"
        sx={{
          width: '100%',
          borderRadius: 2,
          background: 'linear-gradient(145deg, rgba(33, 150, 243, 0.95), rgba(33, 150, 243, 0.85))',
          backdropFilter: 'blur(10px)',
          color: 'white',
        }}
        icon={<UpdateIcon />}
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              color="inherit"
              size="small"
              onClick={handleDismiss}
            >
              Later
            </Button>
            <Button
              color="inherit"
              size="small"
              onClick={handleUpdate}
              startIcon={<RefreshIcon />}
              variant="outlined"
              sx={{ borderColor: 'white', '&:hover': { borderColor: 'white' } }}
            >
              Update
            </Button>
          </Box>
        }
      >
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            New version available!
          </Typography>
          <Typography variant="body2">
            Update now for the latest features and improvements.
          </Typography>
        </Box>
      </Alert>
    </Snackbar>
  );
}