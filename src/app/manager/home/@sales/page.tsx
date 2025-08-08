"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import Card from "@/components/dashCard"; 
import { Typography, Box, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
  TooltipModel,
  TooltipItem, // This import is important
} from 'chart.js';
import { Line } from 'react-chartjs-2';


// Registering the necessary components for Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);


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



interface ChartDataset {
  label: string;
  data: (number | null)[];
  fill: boolean;
  backgroundColor: string;
  borderColor: string;
  pointBackgroundColor: string;
  pointBorderColor: string;
  pointHoverBackgroundColor: string;
  pointHoverBorderColor: string;
  tension: number;
}

interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

type SalesPeriod = 'daily' | 'weekly' | 'monthly';

export default function Sales() {
    const [period, setPeriod] = useState<SalesPeriod>('monthly');
    const [chartData, setChartData] = useState<ChartData>({
      labels: [],
      datasets: [],
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`/api/manager/analytics?period=${period}`);
                const { salesData } = response.data;
                
                setChartData({
                    labels: salesData.map((item: { label: string }) => item.label),
                    datasets: [
                        {
                            label: 'Sales',
                            data: salesData.map((item: { value: number }) => item.value),
                            fill: true,
                            backgroundColor: 'rgba(5, 65, 22, 0.2)',
                            borderColor: '#054116',
                            pointBackgroundColor: '#054116',
                            pointBorderColor: '#fff',
                            pointHoverBackgroundColor: '#fff',
                            pointHoverBorderColor: '#054116',
                            tension: 0.4,
                        },
                    ],
                });
            } catch (error) {
                console.error('Error fetching sales data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [period]);

    const handlePeriodChange = (
        event: React.MouseEvent<HTMLElement>,
        newPeriod: SalesPeriod | null,
    ) => {
        if (newPeriod !== null) {
            setPeriod(newPeriod);
        }
    };

    // MODIFIED: Added specific ChartOptions type for a 'line' chart
    const chartOptions: ChartOptions<'line'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                titleFont: {
                    weight: 'bold',
                },
                bodyFont: {
                    size: 14,
                },
                callbacks: {
  label: function(this: TooltipModel<"line">, tooltipItem: TooltipItem<"line">) {
    let label = tooltipItem.dataset.label ?? '';
    if (label) {
      label += ': ';
    }
    if (tooltipItem.parsed.y !== null) {
      label += new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(tooltipItem.parsed.y);
    }
    return label;
  }
}
            },
        },
        scales: {
            y: {
                grid: {
                    color: 'rgba(0, 0, 0, 0.1)',
                },
                ticks: {
                    callback: function(value: number | string) {
                         if (typeof value === 'number') {
                            return new Intl.NumberFormat('en-IN', {
                                style: 'currency',
                                currency: 'INR',
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                            }).format(value);
                         }
                         return value;
                    }
                }
            },
            x: {
                grid: {
                    display: false,
                }
            }
        }
    };

    return (
        <Card>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Sales Performance</Typography>
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

            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Box sx={{ height: '550px', width: '100%', position: 'relative' }}>
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                            <Typography>Loading chart data...</Typography>
                        </Box>
                    ) : (
                        <Line options={chartOptions} data={chartData} />
                    )}
                </Box>
            </Box>
        </Card>
    );
}