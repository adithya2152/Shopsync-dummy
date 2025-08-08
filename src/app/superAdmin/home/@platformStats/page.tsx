"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import Card from "@/components/dashCard";
import { Typography, Box, Grid, CircularProgress } from "@mui/material";
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
} from 'chart.js';
import { Line } from 'react-chartjs-2';

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

interface SalesDataPoint {
    month: string;
    revenue: number;
}

export default function PlatformStats() {
    const [salesData, setSalesData] = useState<SalesDataPoint[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get('/api/superadmin/analytics');
                setSalesData(response.data.salesData);
            } catch (error) {
                console.error('Error fetching platform stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const chartData = {
        labels: salesData.map(item => item.month),
        datasets: [
            {
                label: 'Platform Revenue',
                data: salesData.map(item => item.revenue),
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
    };

    const chartOptions: ChartOptions<'line'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                callbacks: {
                    label: function(context) {
                        return `Revenue: ₹${context.parsed.y.toLocaleString()}`;
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
                    callback: function(value) {
                        if (typeof value === 'number') {
                            return `₹${value.toLocaleString()}`;
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
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Platform Revenue Trends
            </Typography>
            <Box sx={{ height: '300px', width: '100%' }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Line options={chartOptions} data={chartData} />
                )}
            </Box>
        </Card>
    );
}