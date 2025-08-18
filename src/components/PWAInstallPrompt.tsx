// "use client";

// import { useState, useEffect } from 'react';
// import {
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   Button,
//   Typography,
//   Box,
//   IconButton,
//   Snackbar,
//   Alert,
// } from '@mui/material';
// import {
//   GetApp as AndroidIcon,
//   IosShare as IosIcon,
//   Close as CloseIcon,
//   Add as AddIcon,
// } from '@mui/icons-material';

// interface BeforeInstallPromptEvent extends Event {
//   prompt(): Promise<void>;
//   userChoice: Promise<{
//     outcome: 'accepted' | 'dismissed';
//     platform: string;
//   }>;
// }

// export default function PWAInstallPrompt() {
//   const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
//   const [showInstallDialog, setShowInstallDialog] = useState(false);
//   const [isIOS, setIsIOS] = useState(false);
//   const [isStandalone, setIsStandalone] = useState(false);
//   const [showIOSInstructions, setShowIOSInstructions] = useState(false);
//   const [installDismissed, setInstallDismissed] = useState(false);

//   useEffect(() => {
//     // Check if device is iOS
//     const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
//     setIsIOS(iOS);

//     // Check if app is already installed (standalone mode)
//     const standalone = window.matchMedia('(display-mode: standalone)').matches || 
//                      (window.navigator as any).standalone === true;
//     setIsStandalone(standalone);

//     // Check if user has previously dismissed the install prompt
//     const dismissed = localStorage.getItem('pwa-install-dismissed');
//     setInstallDismissed(dismissed === 'true');

//     // Listen for the beforeinstallprompt event (Android/Desktop)
//     const handleBeforeInstallPrompt = (e: Event) => {
//       e.preventDefault();
//       setDeferredPrompt(e as BeforeInstallPromptEvent);
      
//       // Show install prompt after a delay if not dismissed
//       if (!dismissed) {
//         setTimeout(() => {
//           setShowInstallDialog(true);
//         }, 3000);
//       }
//     };

//     window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

//     // For iOS devices, show install instructions if not standalone and not dismissed
//     if (iOS && !standalone && !dismissed) {
//       setTimeout(() => {
//         setShowIOSInstructions(true);
//       }, 5000);
//     }

//     return () => {
//       window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
//     };
//   }, []);

//   const handleInstallClick = async () => {
//     if (!deferredPrompt) return;

//     deferredPrompt.prompt();
//     const { outcome } = await deferredPrompt.userChoice;
    
//     if (outcome === 'accepted') {
//       console.log('User accepted the install prompt');
//     } else {
//       console.log('User dismissed the install prompt');
//       localStorage.setItem('pwa-install-dismissed', 'true');
//     }
    
//     setDeferredPrompt(null);
//     setShowInstallDialog(false);
//   };

//   const handleDismiss = () => {
//     setShowInstallDialog(false);
//     localStorage.setItem('pwa-install-dismissed', 'true');
//     setInstallDismissed(true);
//   };

//   const handleIOSDismiss = () => {
//     setShowIOSInstructions(false);
//     localStorage.setItem('pwa-install-dismissed', 'true');
//     setInstallDismissed(true);
//   };

//   // Don't show anything if app is already installed or user dismissed
//   if (isStandalone || installDismissed) {
//     return null;
//   }

//   return (
//     <>
//       {/* Android/Desktop Install Dialog */}
//       <Dialog
//         open={showInstallDialog && !isIOS}
//         onClose={handleDismiss}
//         maxWidth="sm"
//         fullWidth
//         PaperProps={{
//           sx: {
//             borderRadius: 3,
//             background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.7))',
//             backdropFilter: 'blur(10px)',
//           }
//         }}
//       >
//         <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
//           <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//             <AndroidIcon color="primary" />
//             <Typography variant="h6">Install ShopSync</Typography>
//           </Box>
//           <IconButton onClick={handleDismiss} size="small">
//             <CloseIcon />
//           </IconButton>
//         </DialogTitle>
        
//         <DialogContent>
//           <Typography variant="body1" gutterBottom>
//             Install ShopSync for a better experience:
//           </Typography>
//           <Box component="ul" sx={{ pl: 2, mt: 2 }}>
//             <Typography component="li" variant="body2" sx={{ mb: 1 }}>
//               ⚡ Faster loading and better performance
//             </Typography>
//             <Typography component="li" variant="body2" sx={{ mb: 1 }}>
//               📱 Works offline with cached content
//             </Typography>
//             <Typography component="li" variant="body2" sx={{ mb: 1 }}>
//               🔔 Push notifications for order updates
//             </Typography>
//             <Typography component="li" variant="body2" sx={{ mb: 1 }}>
//               🏠 Easy access from your home screen
//             </Typography>
//           </Box>
//         </DialogContent>
        
//         <DialogActions sx={{ p: 2, gap: 1 }}>
//           <Button onClick={handleDismiss} color="inherit">
//             Not Now
//           </Button>
//           <Button 
//             onClick={handleInstallClick} 
//             variant="contained" 
//             sx={{ 
//               background: 'linear-gradient(45deg, #4CAF50, #45a049)',
//               '&:hover': {
//                 background: 'linear-gradient(45deg, #45a049, #3d8b40)',
//               }
//             }}
//           >
//             Install App
//           </Button>
//         </DialogActions>
//       </Dialog>

//       {/* iOS Install Instructions */}
//       <Snackbar
//         open={showIOSInstructions && isIOS}
//         onClose={handleIOSDismiss}
//         anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
//         sx={{ mb: 2 }}
//       >
//         <Alert
//           onClose={handleIOSDismiss}
//           severity="info"
//           sx={{
//             width: '100%',
//             borderRadius: 2,
//             background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.85))',
//             backdropFilter: 'blur(10px)',
//           }}
//           action={
//             <IconButton size="small" onClick={handleIOSDismiss}>
//               <CloseIcon fontSize="small" />
//             </IconButton>
//           }
//         >
//           <Box>
//             <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
//               Install ShopSync on iOS
//             </Typography>
//             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
//               <Typography variant="body2">
//                 1. Tap the share button
//               </Typography>
//               <IosIcon fontSize="small" />
//             </Box>
//             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//               <Typography variant="body2">
//                 2. Select "Add to Home Screen"
//               </Typography>
//               <AddIcon fontSize="small" />
//             </Box>
//           </Box>
//         </Alert>
//       </Snackbar>

//       {/* Floating Install Button (for manual trigger) */}
//       {(deferredPrompt || isIOS) && !installDismissed && (
//         <Button
//           onClick={isIOS ? () => setShowIOSInstructions(true) : handleInstallClick}
//           variant="contained"
//           sx={{
//             position: 'fixed',
//             bottom: 20,
//             left: 20,
//             borderRadius: '50px',
//             background: 'linear-gradient(45deg, #4CAF50, #45a049)',
//             color: 'white',
//             px: 3,
//             py: 1,
//             zIndex: 1000,
//             boxShadow: '0 4px 20px rgba(76, 175, 80, 0.4)',
//             '&:hover': {
//               background: 'linear-gradient(45deg, #45a049, #3d8b40)',
//               transform: 'translateY(-2px)',
//             },
//             transition: 'all 0.3s ease',
//           }}
//           startIcon={isIOS ? <IosIcon /> : <AndroidIcon />}
//         >
//           Install App
//         </Button>
//       )}
//     </>
//   );
// }

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
  Snackbar,
  Alert,
} from '@mui/material';
import {
  GetApp as InstallIcon,
  IosShare as IosIcon,
  Add as AddIcon,
} from '@mui/icons-material';

// Define the event type for TypeScript
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallDialog, setShowInstallDialog] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if the app is already installed (standalone mode)
    const runningStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                             (window.navigator as unknown as { standalone: boolean }).standalone === true;
    setIsStandalone(runningStandalone);

    // If already installed, do nothing
    if (runningStandalone) {
      return;
    }

    const iOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOSDevice);

    const hasShownInitialPrompt = localStorage.getItem('pwa-initial-prompt-shown') === 'true';

    // Handler for the 'beforeinstallprompt' event (for Android/Desktop)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show the install dialog automatically only on the first visit
      if (!hasShownInitialPrompt) {
        setTimeout(() => {
          setShowInstallDialog(true);
        }, 3000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Show iOS install instructions automatically only on the first visit
    if (iOSDevice && !hasShownInitialPrompt) {
      setTimeout(() => {
        setShowIOSInstructions(true);
      }, 5000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const setInitialPromptShown = () => {
    localStorage.setItem('pwa-initial-prompt-shown', 'true');
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Hide the dialog and show the native prompt
    setShowInstallDialog(false);
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the PWA installation');
    } else {
      console.log('User dismissed the PWA installation');
    }
    
    setInitialPromptShown();
    setDeferredPrompt(null);
  };

  const handleDismissDialog = () => {
    setShowInstallDialog(false);
    setInitialPromptShown();
  };
  
  const handleDismissIOS = () => {
    setShowIOSInstructions(false);
    setInitialPromptShown();
  };

  const handleFloatingButtonClick = () => {
    if (isIOS) {
      setShowIOSInstructions(true);
    } else if (deferredPrompt) {
      setShowInstallDialog(true);
    }
  };

  // Do not render anything if the app is already installed
  if (isStandalone) {
    return null;
  }

  return (
    <>
      {/* Android/Desktop Install Dialog (triggered automatically once, or by FAB click) */}
      <Dialog
        open={showInstallDialog && !isIOS}
        onClose={handleDismissDialog}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <InstallIcon color="primary" />
          <Typography variant="h6" component="div">Install ShopSync</Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Get the full app experience for fast, reliable access.
          </Typography>
          <Box component="ul" sx={{ pl: 2, mt: 2, fontSize: '0.9rem', color: 'text.secondary' }}>
            <li>⚡ Faster loading and offline access</li>
            <li>🏠 Add to your home screen for easy launch</li>
            <li>🔔 Push notifications for order updates</li>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: '0 16px 16px' }}>
          <Button onClick={handleDismissDialog}>Not Now</Button>
          <Button onClick={handleInstallClick} variant="contained">
            Install
          </Button>
        </DialogActions>
      </Dialog>

      {/* iOS Install Instructions Snackbar */}
      <Snackbar
        open={showIOSInstructions && isIOS}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ mb: 2 }}
      >
        <Alert
          onClose={handleDismissIOS}
          severity="info"
          icon={false}
          sx={{ width: '100%', borderRadius: 2, p: 2, '.MuiAlert-message': { p: 0 } }}
        >
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
              Install ShopSync on your iPhone
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Tap the <IosIcon sx={{ verticalAlign: 'middle', mx: 0.5 }} fontSize="small" /> 
              button, then scroll down and select &apos;Add to Home Screen&apos; 
              <AddIcon sx={{ verticalAlign: 'middle', ml: 0.5 }} fontSize="small" />.
            </Typography>
        </Alert>
      </Snackbar>

      {/* Floating Install Button with Hover Animation */}
      {(deferredPrompt || isIOS) && (
        <Button
          onClick={handleFloatingButtonClick}
          variant="contained"
          sx={{
            position: 'fixed',
            bottom: { xs: 80, sm: 24 }, // Adjust for footer on mobile
            right: 24,
            zIndex: 1301, // Above Dialog backdrop
            color: 'white',
            backgroundColor: '#4CAF50',
            borderRadius: '16px',
            height: '56px',
            minWidth: '56px',
            width: '56px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            padding: '0 16px',
            transition: 'width 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, border-radius 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
            '& .MuiButton-startIcon': {
              margin: 0,
            },
            '& .install-text': {
              display: 'none',
              opacity: 0,
              transition: 'opacity 200ms ease-in-out 100ms',
              whiteSpace: 'nowrap',
              marginLeft: '8px',
            },
            '&:hover': {
              backgroundColor: '#45a049',
              width: 'auto',
              borderRadius: '16px',
              '& .install-text': {
                display: 'inline',
                opacity: 1,
              },
            },
          }}
          startIcon={isIOS ? <IosIcon /> : <InstallIcon />}
        >
          <span className="install-text">Install App</span>
        </Button>
      )}
    </>
  );
}