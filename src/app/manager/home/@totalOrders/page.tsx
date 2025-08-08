"use client";

import { useState, useEffect } from 'react';
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

 
const ordersData = {
    daily: {
        count: 25,
        change: 15.0,
        changeType: 'increase' as 'increase' | 'decrease',
        period: 'vs yesterday'
    },
    weekly: {
        count: 150,
        change: 8.1,
        changeType: 'increase' as 'increase' | 'decrease',
        period: 'vs last week'
    },
    monthly: {
        count: 620,
        change: 2.3,
        changeType: 'decrease' as 'increase' | 'decrease',
        period: 'vs last month'
    }
};

type OrderPeriod = 'daily' | 'weekly' | 'monthly';

export default function TotalOrders() {
    const [period, setPeriod] = useState<OrderPeriod>('monthly');
    const [data, setData] = useState(ordersData.monthly);

    
    useEffect(() => {
        setData(ordersData[period]);
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
                    {data.count.toLocaleString('en-US')}
                </Typography>
                <ChangeIndicator />
            </Box>
        </Card>
    );
}
