"use client";

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  useMediaQuery,
  useTheme,
  Slide,
  Paper
} from '@mui/material';
import { Close, GetApp, PhoneIphone, TabletMac } from '@mui/icons-material';
import { TransitionProps } from '@mui/material/transitions';
import React from 'react';

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    // Check if app is already installed
    const checkIfInstalled = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = (window.navigator as any).standalone === true;
      setIsStandalone(isStandaloneMode || isIOSStandalone);
      setIsInstalled(isStandaloneMode || isIOSStandalone);
    };

    // Check if device is iOS
    const checkIfIOS = () => {
      const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
      setIsIOS(isIOSDevice);
    };

    checkIfInstalled();
    checkIfIOS();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show install prompt after a delay (only on mobile and if not installed)
      if (isMobile && !isInstalled) {
        setTimeout(() => {
          setShowInstallPrompt(true);
        }, 3000);
      }
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('PWA was installed');
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isMobile, isInstalled]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    // Don't show again for this session
    sessionStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  // Don't show if already installed or dismissed this session
  if (isInstalled || sessionStorage.getItem('pwa-prompt-dismissed')) {
    return null;
  }

  // iOS Install Instructions Dialog
  if (isIOS && showInstallPrompt) {
    return (
      <Dialog
        open={showInstallPrompt}
        TransitionComponent={Transition}
        keepMounted
        onClose={handleDismiss}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
          <PhoneIphone sx={{ fontSize: 40, color: '#054116', mb: 1 }} />
          <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
            Install ShopSync
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Get the full ShopSync experience! Install our app for:
            </Typography>
            <Box sx={{ textAlign: 'left', mb: 3 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>• Faster loading times</Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>• Offline browsing</Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>• Push notifications for orders</Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>• Home screen access</Typography>
            </Box>
            
            <Paper sx={{ p: 2, backgroundColor: '#f5f5f5', mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                To install on iOS:
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                1. Tap the Share button <span style={{ fontSize: '1.2em' }}>⬆️</span>
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                2. Scroll down and tap "Add to Home Screen"
              </Typography>
              <Typography variant="body2">
                3. Tap "Add" to install ShopSync
              </Typography>
            </Paper>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button onClick={handleDismiss} color="inherit">
            Maybe Later
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  // Android/Desktop Install Dialog
  return (
    <Dialog
      open={showInstallPrompt && !!deferredPrompt}
      TransitionComponent={Transition}
      keepMounted
      onClose={handleDismiss}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
        <Box sx={{ position: 'relative' }}>
          <IconButton
            onClick={handleDismiss}
            sx={{ position: 'absolute', right: -16, top: -8 }}
          >
            <Close />
          </IconButton>
          <GetApp sx={{ fontSize: 40, color: '#054116', mb: 1 }} />
          <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
            Install ShopSync
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Get the full ShopSync experience! Install our app for:
          </Typography>
          <Box sx={{ textAlign: 'left', mb: 3 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>✓ Faster loading and better performance</Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>✓ Work offline and sync when online</Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>✓ Push notifications for order updates</Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>✓ Quick access from your home screen</Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>✓ Native app-like experience</Typography>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            {isMobile ? (
              <PhoneIphone sx={{ fontSize: 60, color: '#054116' }} />
            ) : (
              <TabletMac sx={{ fontSize: 60, color: '#054116' }} />
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', pb: 3, gap: 2 }}>
        <Button onClick={handleDismiss} color="inherit" variant="outlined">
          Maybe Later
        </Button>
        <Button 
          onClick={handleInstallClick} 
          variant="contained" 
          sx={{ 
            backgroundColor: '#054116',
            '&:hover': { backgroundColor: '#043511' }
          }}
          startIcon={<GetApp />}
        >
          Install App
        </Button>
      </DialogActions>
    </Dialog>
  );
}