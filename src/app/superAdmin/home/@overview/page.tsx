"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import Card from "@/components/dashCard";
import { Typography, Box, Grid, CircularProgress } from "@mui/material";
import { TrendingUp, TrendingDown, Store, People, Inventory, ShoppingCart } from "@mui/icons-material";

interface OverviewData {
    totalUsers: number;
    totalShops: number;
    totalProducts: number;
    monthlyRevenue: number;
    revenueGrowth: number;
    monthlyOrders: number;
    ordersGrowth: number;
}

export default function Overview() {
    const [data, setData] = useState<OverviewData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get('/api/superadmin/analytics');
                setData(response.data.overview);
            } catch (error) {
                console.error('Error fetching overview data:', error);
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

    if (!data) {
        return (
            <Card>
                <Typography variant="h6" color="error">Failed to load overview data</Typography>
            </Card>
        );
    }

    const StatItem = ({ icon, title, value, growth, isRevenue = false }: {
        icon: React.ReactNode;
        title: string;
        value: number;
        growth?: number;
        isRevenue?: boolean;
    }) => (
        <Box sx={{ textAlign: 'center', p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                {icon}
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                {isRevenue ? `₹${value.toLocaleString()}` : value.toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {title}
            </Typography>
            {growth !== undefined && (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {growth >= 0 ? (
                        <TrendingUp sx={{ color: 'success.main', fontSize: '1rem', mr: 0.5 }} />
                    ) : (
                        <TrendingDown sx={{ color: 'error.main', fontSize: '1rem', mr: 0.5 }} />
                    )}
                    <Typography 
                        variant="caption" 
                        sx={{ 
                            color: growth >= 0 ? 'success.main' : 'error.main',
                            fontWeight: 'bold'
                        }}
                    >
                        {Math.abs(growth).toFixed(1)}%
                    </Typography>
                </Box>
            )}
        </Box>
    );

    return (
        <Card>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', textAlign: 'center', mb: 3 }}>
                Platform Overview
            </Typography>
            <Grid container spacing={2}>
                <Grid item xs={6}>
                    <StatItem
                        icon={<People sx={{ fontSize: '2rem', color: '#054116' }} />}
                        title="Total Users"
                        value={data.totalUsers}
                    />
                </Grid>
                <Grid item xs={6}>
                    <StatItem
                        icon={<Store sx={{ fontSize: '2rem', color: '#054116' }} />}
                        title="Total Shops"
                        value={data.totalShops}
                    />
                </Grid>
                <Grid item xs={6}>
                    <StatItem
                        icon={<Inventory sx={{ fontSize: '2rem', color: '#054116' }} />}
                        title="Total Products"
                        value={data.totalProducts}
                    />
                </Grid>
                <Grid item xs={6}>
                    <StatItem
                        icon={<ShoppingCart sx={{ fontSize: '2rem', color: '#054116' }} />}
                        title="Monthly Orders"
                        value={data.monthlyOrders}
                        growth={data.ordersGrowth}
                    />
                </Grid>
            </Grid>
            <Box sx={{ mt: 2, p: 2, backgroundColor: 'rgba(5, 65, 22, 0.1)', borderRadius: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold', textAlign: 'center' }}>
                    ₹{data.monthlyRevenue.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                    Monthly Revenue
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1 }}>
                    {data.revenueGrowth >= 0 ? (
                        <TrendingUp sx={{ color: 'success.main', fontSize: '1rem', mr: 0.5 }} />
                    ) : (
                        <TrendingDown sx={{ color: 'error.main', fontSize: '1rem', mr: 0.5 }} />
                    )}
                    <Typography 
                        variant="body2" 
                        sx={{ 
                            color: data.revenueGrowth >= 0 ? 'success.main' : 'error.main',
                            fontWeight: 'bold'
                        }}
                    >
                        {Math.abs(data.revenueGrowth).toFixed(1)}% vs last month
                    </Typography>
                </Box>
            </Box>
        </Card>
    );
}