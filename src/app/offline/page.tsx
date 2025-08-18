"use client";

import {
  Box,
  Typography,
  Button,
  Container,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  WifiOff as OfflineIcon,
  Refresh as RefreshIcon,
  Home as HomeIcon,
  ShoppingCart as CartIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

export default function OfflinePage() {
  const router = useRouter();

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    router.push('/');
  };

  const offlineFeatures = [
    {
      icon: <HomeIcon />,
      title: 'Browse Categories',
      description: 'View cached product categories and basic information'
    },
    {
      icon: <CartIcon />,
      title: 'View Cart',
      description: 'Access your saved cart items (if previously loaded)'
    },
    {
      icon: <HistoryIcon />,
      title: 'Order History',
      description: 'View your recent orders (if previously cached)'
    },
  ];

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box textAlign="center" mb={4}>
        <OfflineIcon sx={{ fontSize: 80, color: '#ff9800', mb: 2 }} />
        <Typography variant="h3" gutterBottom sx={{ fontWeight: 'bold' }}>
          You&apos;re Offline
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No internet connection detected
        </Typography>
      </Box>

      <Card
        raised
        sx={{
          mb: 4,
          background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.7))',
          backdropFilter: 'blur(10px)',
          borderRadius: 3,
        }}
      >
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
            What you can do offline:
          </Typography>
          
          <List sx={{ maxWidth: 600, mx: 'auto' }}>
            {offlineFeatures.map((feature, index) => (
              <ListItem key={index} sx={{ py: 2 }}>
                <ListItemIcon sx={{ color: '#4CAF50' }}>
                  {feature.icon}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      {feature.title}
                    </Typography>
                  }
                  secondary={feature.description}
                />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>

      <Box textAlign="center" sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Button
          variant="contained"
          onClick={handleRefresh}
          startIcon={<RefreshIcon />}
          sx={{
            background: 'linear-gradient(45deg, #4CAF50, #45a049)',
            '&:hover': {
              background: 'linear-gradient(45deg, #45a049, #3d8b40)',
            }
          }}
        >
          Try Again
        </Button>
        
        <Button
          variant="outlined"
          onClick={handleGoHome}
          startIcon={<HomeIcon />}
        >
          Go Home
        </Button>
      </Box>

      <Box mt={4} textAlign="center">
        <Typography variant="body2" color="text.secondary">
          ShopSync works offline with cached content. 
          Connect to the internet for the full experience.
        </Typography>
      </Box>
    </Container>
  );
}