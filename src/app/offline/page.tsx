"use client";

import { useEffect, useState } from 'react';
import { 
  Container, 
  Typography, 
  Button, 
  Box, 
  Card, 
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { 
  WifiOff, 
  Refresh, 
  ShoppingCart, 
  History, 
  Person, 
  Category 
} from '@mui/icons-material';
import Nav from '@/components/Nav';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    if (isOnline) {
      window.location.href = '/';
    } else {
      window.location.reload();
    }
  };

  const offlineFeatures = [
    {
      icon: <ShoppingCart />,
      title: 'Browse Cart',
      description: 'View items in your cart'
    },
    {
      icon: <History />,
      title: 'Order History',
      description: 'Check your previous orders'
    },
    {
      icon: <Person />,
      title: 'Profile',
      description: 'View and edit your profile'
    },
    {
      icon: <Category />,
      title: 'Categories',
      description: 'Browse cached categories'
    }
  ];

  return (
    <>
      <Nav navType="landing" />
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box textAlign="center" mb={4}>
          <WifiOff sx={{ fontSize: 80, color: '#054116', mb: 2 }} />
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: '#054116' }}>
            You're Offline
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
            No internet connection detected. Some features are still available!
          </Typography>
          
          <Button
            variant="contained"
            size="large"
            startIcon={isOnline ? <Refresh /> : <WifiOff />}
            onClick={handleRetry}
            sx={{ 
              backgroundColor: isOnline ? '#054116' : '#666',
              '&:hover': { 
                backgroundColor: isOnline ? '#043511' : '#555' 
              },
              mb: 4
            }}
          >
            {isOnline ? 'Go Back Online' : 'Retry Connection'}
          </Button>
        </Box>

        <Card raised sx={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
          <CardContent>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', textAlign: 'center', mb: 3 }}>
              Available Offline Features
            </Typography>
            
            <List>
              {offlineFeatures.map((feature, index) => (
                <ListItem key={index} sx={{ mb: 1 }}>
                  <ListItemIcon sx={{ color: '#054116' }}>
                    {feature.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={feature.title}
                    secondary={feature.description}
                    primaryTypographyProps={{ fontWeight: 'bold' }}
                  />
                </ListItem>
              ))}
            </List>
            
            <Box sx={{ mt: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                Your data will automatically sync when you're back online.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </>
  );
}