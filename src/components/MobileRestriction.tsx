"use client";

import { useState, useEffect } from 'react';
import { Box, Typography, Button, useMediaQuery, Theme } from '@mui/material';
import axios, { isAxiosError } from 'axios';
import { useRouter } from 'next/navigation';
import { Toaster, toast } from 'react-hot-toast';

// Helper function to get a cookie by name from the browser
const getCookie = (name: string): string | undefined => {
  if (typeof document === 'undefined') {
    return undefined;
  }
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
};

export default function MobileRestriction({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<string | null>(null);
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('md'));
  const router = useRouter();

  useEffect(() => {
    // We need to get the cookie on the client-side
    const userRole = getCookie('role');
    setRole(userRole || null);
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout');
      toast.success('Logged out successfully');
      router.push('/login');
      router.refresh();
    } catch (error) {
      if (isAxiosError(error)) {
        toast.error('Failed to log out');
      }
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  // If the role is not 'customer' and the view is mobile, show the restriction.
  if (role && role !== 'customer' && isMobile) {
    return (
      <>
        <Toaster />
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            textAlign: 'center',
            padding: 2,
            backgroundColor: '#f4f4f4',
          }}
        >
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
            Unsupported View
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, maxWidth: '400px' }}>
            This role is not supported in mobile view. Please log in from a desktop device to continue.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="contained" color="error" onClick={handleLogout}>
              Logout
            </Button>
            <Button variant="outlined" onClick={handleRefresh}>
              Refresh Page
            </Button>
          </Box>
        </Box>
      </>
    );
  }

  // Otherwise, render the actual page content
  return <>{children}</>;
}