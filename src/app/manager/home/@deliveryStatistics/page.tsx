"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import Card from "@/components/dashCard"; 
import { Typography, Box, List, ListItem, ListItemIcon, ListItemText, LinearProgress, CircularProgress } from "@mui/material";
import { PendingActions, LocalShipping, CheckCircleOutline, ErrorOutline } from "@mui/icons-material";

interface DeliveryStats {
    pending: number;
    outForDelivery: number;
    completedToday: number;
    delayed: number;
    onTimeRate: number;
}

export default function Delivery() {
    const [deliveryStats, setDeliveryStats] = useState<DeliveryStats>({
        pending: 25,
        outForDelivery: 12,
        completedToday: 45,
        delayed: 3,
        onTimeRate: 97,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get('/api/manager/delivery-stats');
                setDeliveryStats(response.data);
            } catch (error) {
                console.error('Error fetching delivery stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

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
                Delivery Statistics
            </Typography>
            <List dense>
                <ListItem>
                    <ListItemIcon><PendingActions color="warning" /></ListItemIcon>
                    <ListItemText
                        primary="Pending Orders"
                        secondary={`${deliveryStats.pending} orders awaiting confirmation`}
                    />
                </ListItem>
                <ListItem>
                    <ListItemIcon><LocalShipping color="info" /></ListItemIcon>
                    <ListItemText
                        primary="Out for Delivery"
                        secondary={`${deliveryStats.outForDelivery} orders currently on the road`}
                    />
                </ListItem>
                <ListItem>
                    <ListItemIcon><CheckCircleOutline color="success" /></ListItemIcon>
                    <ListItemText
                        primary="Completed Today"
                        secondary={`${deliveryStats.completedToday} orders delivered successfully`}
                    />
                </ListItem>
                <ListItem>
                    <ListItemIcon><ErrorOutline color="error" /></ListItemIcon>
                    <ListItemText
                        primary="Delayed"
                        secondary={`${deliveryStats.delayed} orders are past their estimated delivery time`}
                    />
                </ListItem>
            </List>
            <Box sx={{ mt: 'auto', pt: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>On-time Delivery Rate</Typography>
                <LinearProgress
                    variant="determinate"
                    value={deliveryStats.onTimeRate}
                    sx={{
                        height: 10,
                        borderRadius: 5,
                        mt: 1,
                        '& .MuiLinearProgress-bar': {
                            backgroundColor: '#054116', // Match theme color
                        }
                    }}
                />
                <Typography variant="body2" align="right" sx={{ mt: 0.5 }}>
                    {deliveryStats.onTimeRate}%
                </Typography>
            </Box>
        </Card>
    );
}
