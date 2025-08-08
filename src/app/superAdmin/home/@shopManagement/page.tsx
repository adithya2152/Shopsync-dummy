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
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    CircularProgress,
    IconButton,
    Tooltip
} from "@mui/material";
import { 
    Store, 
    Add, 
    Delete,
    Edit,
    Person
} from "@mui/icons-material";

interface Shop {
    id: number;
    name: string;
    location: any;
    createdAt: string;
    managerName: string | null;
    managerEmail: string | null;
}

export default function ShopManagement() {
    const [shops, setShops] = useState<Shop[]>([]);
    const [loading, setLoading] = useState(true);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [newShop, setNewShop] = useState({
        shopName: '',
        shopLocation: { latitude: 0, longitude: 0, address: '' },
        managerName: '',
        managerEmail: '',
        managerPassword: '',
        managerLocation: { latitude: 0, longitude: 0, address: '' }
    });
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [showResults, setShowResults] = useState(false);
    const [addressType, setAddressType] = useState<'shop' | 'manager'>('shop');

    useEffect(() => {
        fetchShops();
    }, []);

    const fetchShops = async () => {
        try {
            const response = await axios.get('/api/superadmin/shops');
            setShops(response.data);
        } catch (error) {
            console.error('Error fetching shops:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchLocation = async (query: string, type: 'shop' | 'manager') => {
        if (!query.trim()) {
            setSearchResults([]);
            setShowResults(false);
            return;
        }

        try {
            const res = await axios.get(
                `https://nominatim.openstreetmap.org/search`,
                {
                    params: {
                        q: query,
                        format: "json",
                        limit: 5,
                    },
                }
            );

            const formattedResults = res.data.map((place: any) => ({
                name: place.display_name,
                lat: place.lat,
                lon: place.lon,
            }));

            setSearchResults(formattedResults);
            setShowResults(formattedResults.length > 0);
            setAddressType(type);
        } catch (error) {
            console.error("Location Search Error:", error);
            setSearchResults([]);
            setShowResults(false);
        }
    };

    const handleSelectLocation = (location: any, type: 'shop' | 'manager') => {
        const locationData = {
            latitude: parseFloat(location.lat),
            longitude: parseFloat(location.lon),
            address: location.name
        };

        if (type === 'shop') {
            setNewShop(prev => ({
                ...prev,
                shopLocation: locationData
            }));
        } else {
            setNewShop(prev => ({
                ...prev,
                managerLocation: locationData
            }));
        }
        setShowResults(false);
    };

    const handleUseCurrentLocation = (type: 'shop' | 'manager') => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser.");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                
                try {
                    const res = await axios.get(
                        `https://nominatim.openstreetmap.org/reverse`,
                        {
                            params: {
                                lat: latitude,
                                lon: longitude,
                                format: "json",
                            },
                        }
                    );

                    const locationData = {
                        latitude,
                        longitude,
                        address: res.data.display_name
                    };

                    if (type === 'shop') {
                        setNewShop(prev => ({
                            ...prev,
                            shopLocation: locationData
                        }));
                    } else {
                        setNewShop(prev => ({
                            ...prev,
                            managerLocation: locationData
                        }));
                    }
                } catch (error) {
                    console.error("Reverse Geocoding Error:", error);
                }
            },
            (error) => {
                alert("Failed to get location. Please enable location services.");
                console.error("Geolocation Error:", error);
            }
        );
    };

    const handleCreateShop = async () => {
        try {
            await axios.post('/api/superadmin/create-shop', newShop);
            setCreateDialogOpen(false);
            setNewShop({
                shopName: '',
                shopLocation: { latitude: 0, longitude: 0, address: '' },
                managerName: '',
                managerEmail: '',
                managerPassword: '',
                managerLocation: { latitude: 0, longitude: 0, address: '' }
            });
            fetchShops();
        } catch (error) {
            console.error('Error creating shop:', error);
        }
    };

    const handleDeleteShop = async (shopId: number) => {
        if (confirm('Are you sure you want to delete this shop? This will also delete all associated data.')) {
            try {
                await axios.delete(`/api/superadmin/shops?shopId=${shopId}`);
                fetchShops();
            } catch (error) {
                console.error('Error deleting shop:', error);
            }
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Shop Management
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => setCreateDialogOpen(true)}
                    sx={{ backgroundColor: '#054116' }}
                >
                    Add Shop
                </Button>
            </Box>

            <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                {shops.slice(0, 8).map((shop) => (
                    <ListItem 
                        key={shop.id}
                        sx={{ 
                            border: '1px solid rgba(0,0,0,0.1)', 
                            borderRadius: 1, 
                            mb: 1,
                            backgroundColor: 'rgba(255,255,255,0.3)'
                        }}
                    >
                        <ListItemIcon>
                            <Store sx={{ color: '#054116' }} />
                        </ListItemIcon>
                        <ListItemText
                            primary={shop.name}
                            secondary={
                                <Box>
                                    <Typography variant="caption" display="block">
                                        Manager: {shop.managerName || 'Unassigned'}
                                    </Typography>
                                    <Typography variant="caption" display="block">
                                        {shop.managerEmail || 'No email'}
                                    </Typography>
                                </Box>
                            }
                        />
                        <Box>
                            <Tooltip title="Edit Shop">
                                <IconButton size="small" color="primary">
                                    <Edit />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Shop">
                                <IconButton 
                                    size="small" 
                                    color="error"
                                    onClick={() => handleDeleteShop(shop.id)}
                                >
                                    <Delete />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </ListItem>
                ))}
            </List>

            <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>Create New Shop with Manager</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <Typography variant="h6">Shop Details</Typography>
                        <TextField
                            label="Shop Name"
                            value={newShop.shopName}
                            onChange={(e) => setNewShop({...newShop, shopName: e.target.value})}
                            fullWidth
                        />
                        <TextField
                            label="Shop Location"
                            value={newShop.shopLocation.address}
                            onChange={(e) => {
                                setNewShop({...newShop, shopLocation: {...newShop.shopLocation, address: e.target.value}});
                                handleSearchLocation(e.target.value, 'shop');
                            }}
                            fullWidth
                        />
                        {showResults && addressType === 'shop' && (
                            <Box sx={{ maxHeight: 150, overflow: 'auto', border: '1px solid #ccc', borderRadius: 1 }}>
                                {searchResults.map((loc, index) => (
                                    <Box
                                        key={index}
                                        sx={{ p: 1, cursor: 'pointer', '&:hover': { backgroundColor: '#f5f5f5' } }}
                                        onClick={() => handleSelectLocation(loc, 'shop')}
                                    >
                                        <Typography variant="body2">{loc.name}</Typography>
                                    </Box>
                                ))}
                            </Box>
                        )}
                        <Button onClick={() => handleUseCurrentLocation('shop')} variant="outlined">
                            Use Current Location for Shop
                        </Button>

                        <Typography variant="h6" sx={{ mt: 2 }}>Manager Details</Typography>
                        <TextField
                            label="Manager Name"
                            value={newShop.managerName}
                            onChange={(e) => setNewShop({...newShop, managerName: e.target.value})}
                            fullWidth
                        />
                        <TextField
                            label="Manager Email"
                            type="email"
                            value={newShop.managerEmail}
                            onChange={(e) => setNewShop({...newShop, managerEmail: e.target.value})}
                            fullWidth
                        />
                        <TextField
                            label="Manager Password"
                            type="password"
                            value={newShop.managerPassword}
                            onChange={(e) => setNewShop({...newShop, managerPassword: e.target.value})}
                            fullWidth
                        />
                        <TextField
                            label="Manager Home Location"
                            value={newShop.managerLocation.address}
                            onChange={(e) => {
                                setNewShop({...newShop, managerLocation: {...newShop.managerLocation, address: e.target.value}});
                                handleSearchLocation(e.target.value, 'manager');
                            }}
                            fullWidth
                        />
                        {showResults && addressType === 'manager' && (
                            <Box sx={{ maxHeight: 150, overflow: 'auto', border: '1px solid #ccc', borderRadius: 1 }}>
                                {searchResults.map((loc, index) => (
                                    <Box
                                        key={index}
                                        sx={{ p: 1, cursor: 'pointer', '&:hover': { backgroundColor: '#f5f5f5' } }}
                                        onClick={() => handleSelectLocation(loc, 'manager')}
                                    >
                                        <Typography variant="body2">{loc.name}</Typography>
                                    </Box>
                                ))}
                            </Box>
                        )}
                        <Button onClick={() => handleUseCurrentLocation('manager')} variant="outlined">
                            Use Current Location for Manager
                        </Button>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
                    <Button 
                        onClick={handleCreateShop}
                        variant="contained"
                        disabled={!newShop.shopName || !newShop.managerName || !newShop.managerEmail || !newShop.managerPassword}
                    >
                        Create Shop
                    </Button>
                </DialogActions>
            </Dialog>
        </Card>
    );
}