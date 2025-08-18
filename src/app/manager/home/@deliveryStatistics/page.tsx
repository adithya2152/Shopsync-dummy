"use client";

import Card from "@/components/dashCard"; 
import { Typography, Box, List, ListItem, ListItemIcon, ListItemText, LinearProgress } from "@mui/material";
import { PendingActions, LocalShipping, CheckCircleOutline, ErrorOutline } from "@mui/icons-material";

export default function Delivery() {
    // Mock data for demonstration purposes. In a real application, this would be fetched from an API.
    const deliveryStats = {
        pending: 25,
        outForDelivery: 12,
        completedToday: 45,
        delayed: 3,
        onTimeRate: 97, // percentage
    };

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
