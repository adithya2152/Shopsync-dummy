"use client";

import { useEffect, useState } from 'react';
import { Button, Snackbar, Alert } from '@mui/material';
import { Notifications, NotificationsOff } from '@mui/icons-material';

export default function PushNotificationManager() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [showPrompt, setShowPrompt] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }

    // Check for existing subscription
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(async (registration) => {
        const existingSubscription = await registration.pushManager.getSubscription();
        setSubscription(existingSubscription);
      });
    }
  }, []);

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return;
    }

    if (!('serviceWorker' in navigator)) {
      console.log('This browser does not support service workers');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission === 'granted') {
        await subscribeToNotifications();
        setShowPrompt(false);
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  const subscribeToNotifications = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // You would need to generate VAPID keys for production
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'demo-key';
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey
      });

      setSubscription(subscription);

      // Send subscription to server
      const response = await fetch('/api/pwa/notification-permission', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription,
          userId: 'current-user-id' // You'd get this from your auth system
        }),
      });

      if (response.ok) {
        console.log('Push subscription saved successfully');
      }
    } catch (error) {
      console.error('Error subscribing to notifications:', error);
    }
  };

  const unsubscribeFromNotifications = async () => {
    if (subscription) {
      try {
        await subscription.unsubscribe();
        setSubscription(null);
        console.log('Unsubscribed from notifications');
      } catch (error) {
        console.error('Error unsubscribing from notifications:', error);
      }
    }
  };

  // Show prompt for notification permission after some time
  useEffect(() => {
    if (permission === 'default') {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 10000); // Show after 10 seconds

      return () => clearTimeout(timer);
    }
  }, [permission]);

  if (permission === 'denied') {
    return null;
  }

  return (
    <>
      <Snackbar
        open={showPrompt && permission === 'default'}
        autoHideDuration={10000}
        onClose={() => setShowPrompt(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity="info"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={requestNotificationPermission}
              startIcon={<Notifications />}
            >
              Enable
            </Button>
          }
          onClose={() => setShowPrompt(false)}
        >
          Enable notifications to get order updates!
        </Alert>
      </Snackbar>

      {/* Notification settings in profile or settings page */}
      {permission === 'granted' && (
        <div style={{ display: 'none' }}>
          {subscription ? (
            <Button
              startIcon={<NotificationsOff />}
              onClick={unsubscribeFromNotifications}
              variant="outlined"
              color="error"
            >
              Disable Notifications
            </Button>
          ) : (
            <Button
              startIcon={<Notifications />}
              onClick={subscribeToNotifications}
              variant="outlined"
              color="primary"
            >
              Enable Notifications
            </Button>
          )}
        </div>
      )}
    </>
  );
}