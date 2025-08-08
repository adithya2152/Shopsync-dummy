"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import Card from "@/components/dashCard";
import { 
    Typography, 
    Box, 
    List, 
    ListItem, 
    ListItemText, 
    ListItemIcon,
    Chip,
    CircularProgress
} from "@mui/material";
import { 
    ShoppingCart, 
    Store, 
    Person,
    TrendingUp,
    AccessTime
} from "@mui/icons-material";

interface ActivityItem {
    id: string;
    type: 'order' | 'shop' | 'user' | 'revenue';
    title: string;
    description: string;
    timestamp: string;
    status?: string;
}

export default function RecentActivity() {
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Mock data for now - in real app, fetch from API
        const mockActivities: ActivityItem[] = [
            {
                id: '1',
                type: 'order',
                title: 'New Order #1234',
                description: 'Order placed at Green Grocers',
                timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
                status: 'pending'
            },
            {
                id: '2',
                type: 'shop',
                title: 'New Shop Registered',
                description: 'Tech Paradise joined the platform',
                timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
            },
            {
                id: '3',
                type: 'user',
                title: 'New User Registration',
                description: 'Customer signed up from Mumbai',
                timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
            },
            {
                id: '4',
                type: 'revenue',
                title: 'Revenue Milestone',
                description: 'Monthly revenue crossed ₹50,000',
                timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
            },
            {
                id: '5',
                type: 'order',
                title: 'Order Completed #1230',
                description: 'Successfully delivered to customer',
                timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
                status: 'completed'
            }
        ];

        setTimeout(() => {
            setActivities(mockActivities);
            setLoading(false);
        }, 1000);
    }, []);

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'order': return <ShoppingCart sx={{ color: '#1976d2' }} />;
            case 'shop': return <Store sx={{ color: '#ed6c02' }} />;
            case 'user': return <Person sx={{ color: '#2e7d32' }} />;
            case 'revenue': return <TrendingUp sx={{ color: '#d32f2f' }} />;
            default: return <AccessTime sx={{ color: '#757575' }} />;
        }
    };

    const getStatusChip = (status?: string) => {
        if (!status) return null;
        
        const statusConfig = {
            pending: { color: 'warning' as const, label: 'Pending' },
            completed: { color: 'success' as const, label: 'Completed' },
            cancelled: { color: 'error' as const, label: 'Cancelled' }
        };

        const config = statusConfig[status as keyof typeof statusConfig];
        return config ? <Chip label={config.label} color={config.color} size="small" /> : null;
    };

    const formatTimeAgo = (timestamp: string) => {
        const now = new Date();
        const time = new Date(timestamp);
        const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));

        if (diffInMinutes < 60) {
            return `${diffInMinutes}m ago`;
        } else if (diffInMinutes < 1440) {
            return `${Math.floor(diffInMinutes / 60)}h ago`;
        } else {
            return `${Math.floor(diffInMinutes / 1440)}d ago`;
        }
    };

    if (loading) {
        return (
            <Card>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                    <CircularProgress />
                </Box>
            </Card>
        );
    }

    return (
        <Card>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Recent Activity
            </Typography>

            <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                {activities.map((activity) => (
                    <ListItem 
                        key={activity.id}
                        sx={{ 
                            border: '1px solid rgba(0,0,0,0.1)', 
                            borderRadius: 1, 
                            mb: 1,
                            backgroundColor: 'rgba(255,255,255,0.3)'
                        }}
                    >
                        <ListItemIcon>
                            {getActivityIcon(activity.type)}
                        </ListItemIcon>
                        <ListItemText
                            primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                        {activity.title}
                                    </Typography>
                                    {getStatusChip(activity.status)}
                                </Box>
                            }
                            secondary={
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        {activity.description}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {formatTimeAgo(activity.timestamp)}
                                    </Typography>
                                </Box>
                            }
                        />
                    </ListItem>
                ))}
            </List>
        </Card>
    );
}