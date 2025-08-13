"use client";

import { useState, useEffect, useRef } from 'react';
import { Box, Typography } from '@mui/material';
import { Refresh } from '@mui/icons-material';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export default function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const currentY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const PULL_THRESHOLD = 80;
  const MAX_PULL = 120;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isAtTop = true;

    const handleScroll = () => {
      isAtTop = container.scrollTop === 0;
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (!isAtTop || isRefreshing) return;
      startY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isAtTop || isRefreshing) return;
      
      currentY.current = e.touches[0].clientY;
      const diff = currentY.current - startY.current;
      
      if (diff > 0) {
        e.preventDefault();
        const distance = Math.min(diff * 0.5, MAX_PULL);
        setPullDistance(distance);
        setIsPulling(distance > 10);
      }
    };

    const handleTouchEnd = async () => {
      if (!isPulling || isRefreshing) return;
      
      if (pullDistance >= PULL_THRESHOLD) {
        setIsRefreshing(true);
        try {
          await onRefresh();
        } catch (error) {
          console.error('Refresh failed:', error);
        } finally {
          setIsRefreshing(false);
        }
      }
      
      setIsPulling(false);
      setPullDistance(0);
    };

    container.addEventListener('scroll', handleScroll);
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isPulling, pullDistance, isRefreshing, onRefresh]);

  const refreshIndicatorStyle = {
    position: 'fixed' as const,
    top: 0,
    left: '50%',
    transform: `translateX(-50%) translateY(${isPulling || isRefreshing ? pullDistance - 60 : -60}px)`,
    background: 'rgba(5, 65, 22, 0.9)',
    color: 'white',
    padding: '12px 24px',
    borderRadius: '0 0 12px 12px',
    zIndex: 1000,
    transition: isRefreshing ? 'none' : 'transform 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  return (
    <div ref={containerRef} style={{ height: '100vh', overflowY: 'auto' }}>
      <div style={refreshIndicatorStyle}>
        <Refresh 
          sx={{ 
            animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
            '@keyframes spin': {
              '0%': { transform: 'rotate(0deg)' },
              '100%': { transform: 'rotate(360deg)' }
            }
          }} 
        />
        <Typography variant="body2">
          {isRefreshing ? 'Refreshing...' : pullDistance >= PULL_THRESHOLD ? 'Release to refresh' : 'Pull to refresh'}
        </Typography>
      </div>
      {children}
    </div>
  );
}