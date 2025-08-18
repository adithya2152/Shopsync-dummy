"use client";

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Button,
  Alert,
} from '@mui/material';
import {
  Notifications as NotificationIcon,
  Sync as SyncIcon,
  Storage as StorageIcon,
  Wifi as NetworkIcon,
  GetApp as InstallIcon,
} from '@mui/icons-material';
import { usePWA } from '@/hooks/usePWA';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useOfflineSync } from '@/hooks/useOfflineSync';

export default function PWAFeatures() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [backgroundSyncEnabled, setBackgroundSyncEnabled] = useState(false);
  const [cacheSize, setCacheSize] = useState(0);
  
  const { isInstallable, isInstalled, installApp } = usePWA();
  const { isOnline, connectionType } = useNetworkStatus();
  const { queuedActions, isSyncing, syncQueuedActions } = useOfflineSync();

  useEffect(() => {
    // Check notification permission
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }

    // Check background sync support
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      setBackgroundSyncEnabled(true);
    }

    // Calculate cache size
    calculateCacheSize();
  }, []);

  const calculateCacheSize = async () => {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        let totalSize = 0;
        
        for (const cacheName of cacheNames) {
          const cache = await caches.open(cacheName);
          const keys = await cache.keys();
          totalSize += keys.length;
        }
        
        setCacheSize(totalSize);
      } catch (error) {
        console.error('Failed to calculate cache size:', error);
      }
    }
  };

  const handleNotificationToggle = async () => {
    if (!notificationsEnabled) {
      const permission = await Notification.requestPermission();
      setNotificationsEnabled(permission === 'granted');
    } else {
      // Can't programmatically disable notifications, show instructions
      alert('To disable notifications, go to your browser settings or device settings.');
    }
  };

  const handleInstall = async () => {
    const success = await installApp();
    if (success) {
      console.log('App installed successfully');
    }
  };

  const clearCache = async () => {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      setCacheSize(0);
      window.location.reload();
    }
  };

  const features = [
    {
      icon: <InstallIcon />,
      title: 'App Installation',
      description: isInstalled ? 'App is installed' : isInstallable ? 'Ready to install' : 'Not available',
      status: isInstalled ? 'success' : isInstallable ? 'warning' : 'default',
      action: isInstallable && !isInstalled ? (
        <Button size="small" onClick={handleInstall}>Install</Button>
      ) : null,
    },
    {
      icon: <NetworkIcon />,
      title: 'Network Status',
      description: isOnline ? `Online (${connectionType})` : 'Offline',
      status: isOnline ? 'success' : 'error',
    },
    {
      icon: <NotificationIcon />,
      title: 'Push Notifications',
      description: 'Get notified about order updates',
      status: notificationsEnabled ? 'success' : 'default',
      action: (
        <FormControlLabel
          control={
            <Switch
              checked={notificationsEnabled}
              onChange={handleNotificationToggle}
              size="small"
            />
          }
          label=""
        />
      ),
    },
    {
      icon: <SyncIcon />,
      title: 'Background Sync',
      description: backgroundSyncEnabled ? 'Supported' : 'Not supported',
      status: backgroundSyncEnabled ? 'success' : 'default',
      action: isSyncing ? <Chip label="Syncing..." size="small" /> : null,
    },
    {
      icon: <StorageIcon />,
      title: 'Offline Storage',
      description: `${cacheSize} items cached`,
      status: cacheSize > 0 ? 'success' : 'default',
      action: cacheSize > 0 ? (
        <Button size="small" onClick={clearCache}>Clear</Button>
      ) : null,
    },
  ];

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        PWA Features
      </Typography>
      
      {queuedActions.length > 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {queuedActions.length} actions queued for when you&apos;re back online
          {isOnline && (
            <Button size="small" onClick={syncQueuedActions} sx={{ ml: 1 }}>
              Sync Now
            </Button>
          )}
        </Alert>
      )}

      <List>
        {features.map((feature, index) => (
          <Card key={index} sx={{ mb: 1 }}>
            <CardContent sx={{ py: 2 }}>
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon sx={{ color: '#4CAF50' }}>
                  {feature.icon}
                </ListItemIcon>
                <ListItemText
                  primary={feature.title}
                  secondary={feature.description}
                />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    label={feature.status}
                    size="small"
                    color={
                      feature.status === 'success' ? 'success' :
                      feature.status === 'warning' ? 'warning' :
                      feature.status === 'error' ? 'error' : 'default'
                    }
                  />
                  {feature.action}
                </Box>
              </ListItem>
            </CardContent>
          </Card>
        ))}
      </List>
    </Box>
  );
}