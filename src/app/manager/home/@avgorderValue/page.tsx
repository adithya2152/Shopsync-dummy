"use client";

import { useState, useEffect } from 'react';
import Card from "@/components/dashCard"; 
import { Typography, Box, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { styled } from "@mui/material/styles";
import { ShowChart, ArrowUpward, ArrowDownward } from "@mui/icons-material";

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

// --- Mock Data Simulation (replace with API calls) ---

const aovData = {
    daily: {
        amount: 65.25,
        change: 2.1,
        changeType: 'decrease' as 'increase' | 'decrease',
        period: 'vs yesterday'
    },
    weekly: {
        amount: 68.33,
        change: 1.5,
        changeType: 'increase' as 'increase' | 'decrease',
        period: 'vs last week'
    },
    monthly: {
        amount: 71.50,
        change: 0.5,
        changeType: 'increase' as 'increase' | 'decrease',
        period: 'vs last month'
    }
};

type AovPeriod = 'daily' | 'weekly' | 'monthly';

export default function AOV() {
    const [period, setPeriod] = useState<AovPeriod>('monthly');
    const [data, setData] = useState(aovData.monthly);

    // This effect updates the displayed data when the user toggles the period.
    useEffect(() => {
        setData(aovData[period]);
    }, [period]);

    const handlePeriodChange = (
        event: React.MouseEvent<HTMLElement>,
        newPeriod: AovPeriod | null,
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
                <Typography color="text.secondary" gutterBottom>Avg Order Value</Typography>
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
                    <ShowChart sx={{ fontSize: '2.8rem', marginRight: '8px' }} /> 
                    ${data.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography>
                <ChangeIndicator />
            </Box>
        </Card>
    );
}
