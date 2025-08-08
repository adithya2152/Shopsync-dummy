"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import Card from "@/components/dashCard"; 
import { Typography, Box, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { styled } from "@mui/material/styles";
import { ShoppingCart, ArrowUpward, ArrowDownward } from "@mui/icons-material";

// --- Styled Components for internal elements ---

const TimeToggleButtonGroup = styled(ToggleButtonGroup)(({ theme }) => ({
  backgroundColor: 'rgba(255, 255, 255, 0.3)',
  borderRadius: '12px',
  '& .MuiToggleButtonGroup-grouped': {
    margin: theme.spacing(0.5),
    border: 0,
    '&.Mui-disabled': {
      border: 0,
    },
    '&:not(:first-of-type)': {
      borderRadius: theme.shape.borderRadius,
    },
    '&:first-of-type': {
      borderRadius: theme.shape.borderRadius,
    },
    '&.Mui-selected': {
        backgroundColor: '#054116',
        color: 'white',
        '&:hover': {
            backgroundColor: '#043511'
        }
    }
  },
}));

type OrderPeriod = 'daily' | 'weekly' | 'monthly';

interface OrderData {
    count: number;
    change: number;
    changeType: 'increase' | 'decrease';
    period: string;
}

export default function TotalOrders() {
    const [period, setPeriod] = useState<OrderPeriod>('monthly');
    const [data, setData] = useState<OrderData>({
        count: 0,
        change: 0,
        changeType: 'increase',
        period: 'vs last month'
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`/api/manager/analytics?period=${period}`);
                const { orders } = response.data;
                
                const periodMap = {
                    daily: 'vs yesterday',
                    weekly: 'vs last week',
                    monthly: 'vs last month'
                };

                setData({
                    count: orders.current,
                    change: Math.abs(orders.change),
                    changeType: orders.changeType,
                    period: periodMap[period]
                });
            } catch (error) {
                console.error('Error fetching orders data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [period]);

    const handlePeriodChange = (
        event: React.MouseEvent<HTMLElement>,
        newPeriod: OrderPeriod | null,
    ) => {
        if (newPeriod !== null) {
            setPeriod(newPeriod);
        }
    };

    const ChangeIndicator = () => (
        <Box 
            sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: data.changeType === 'increase' ? 'success.main' : 'error.main',
                mt: 1
            }}
        >
            {data.changeType === 'increase' ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />}
            <Typography variant="body2" sx={{ fontWeight: 'bold', ml: 0.5 }}>
                {data.change}% {data.period}
            </Typography>
        </Box>
    );

    return (
        <Card>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Typography color="text.secondary" gutterBottom>Total Orders</Typography>
                <TimeToggleButtonGroup
                    value={period}
                    exclusive
                    onChange={handlePeriodChange}
                    size="small"
                >
                    <ToggleButton value="daily">Daily</ToggleButton>
                    <ToggleButton value="weekly">Weekly</ToggleButton>
                    <ToggleButton value="monthly">Monthly</ToggleButton>
                </TimeToggleButtonGroup>
            </Box>
            <Box sx={{ textAlign: 'center', my: 2, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Typography variant="h3" component="div" sx={{ fontWeight: "bold", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShoppingCart sx={{ fontSize: '2.8rem', marginRight: '8px' }} /> 
                    {loading ? '...' : data.count.toLocaleString('en-US')}
                </Typography>
                <ChangeIndicator />
            </Box>
        </Card>
    );
}