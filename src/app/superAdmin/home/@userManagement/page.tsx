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
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
    IconButton,
    Tooltip
} from "@mui/material";
import { 
    People, 
    PersonAdd, 
    SupervisorAccount, 
    Store, 
    LocalShipping,
    BusinessCenter,
    Delete,
    Edit
} from "@mui/icons-material";

interface User {
    id: number;
    authid: string;
    username: string;
    email: string;
    role: string;
}

interface Shop {
    id: number;
    name: string;
}

export default function UserManagement() {
    const [users, setUsers] = useState<User[]>([]);
    const [shops, setShops] = useState<Shop[]>([]);
    const [loading, setLoading] = useState(true);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [newEmployee, setNewEmployee] = useState({
        username: '',
        email: '',
        password: '',
        role: '',
        shopIds: [] as number[],
        homeLoc: null
    });

    useEffect(() => {
        fetchUsers();
        fetchShops();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await axios.get('/api/superadmin/users');
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchShops = async () => {
        try {
            const response = await axios.get('/api/superadmin/shops');
            setShops(response.data);
        } catch (error) {
            console.error('Error fetching shops:', error);
        }
    };

    const handleCreateEmployee = async () => {
        try {
            await axios.post('/api/superadmin/create-employee', newEmployee);
            setCreateDialogOpen(false);
            setNewEmployee({
                username: '',
                email: '',
                password: '',
                role: '',
                shopIds: [],
                homeLoc: null
            });
            fetchUsers();
        } catch (error) {
            console.error('Error creating employee:', error);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (confirm('Are you sure you want to delete this user?')) {
            try {
                await axios.delete(`/api/superadmin/users?userId=${userId}`);
                fetchUsers();
            } catch (error) {
                console.error('Error deleting user:', error);
            }
        }
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'manager': return <Store fontSize="small" />;
            case 'producthead': return <BusinessCenter fontSize="small" />;
            case 'deliveryassistant': return <LocalShipping fontSize="small" />;
            case 'superAdmin': return <SupervisorAccount fontSize="small" />;
            default: return <People fontSize="small" />;
        }
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'manager': return '#1976d2';
            case 'producthead': return '#ed6c02';
            case 'deliveryassistant': return '#2e7d32';
            case 'superAdmin': return '#d32f2f';
            default: return '#757575';
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
                    User Management
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<PersonAdd />}
                    onClick={() => setCreateDialogOpen(true)}
                    sx={{ backgroundColor: '#054116' }}
                >
                    Add Employee
                </Button>
            </Box>

            <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                {users.slice(0, 10).map((user) => (
                    <ListItem 
                        key={user.id}
                        sx={{ 
                            border: '1px solid rgba(0,0,0,0.1)', 
                            borderRadius: 1, 
                            mb: 1,
                            backgroundColor: 'rgba(255,255,255,0.3)'
                        }}
                    >
                        <ListItemIcon sx={{ color: getRoleColor(user.role) }}>
                            {getRoleIcon(user.role)}
                        </ListItemIcon>
                        <ListItemText
                            primary={user.username}
                            secondary={`${user.email} • ${user.role}`}
                        />
                        <Box>
                            <Tooltip title="Edit User">
                                <IconButton size="small" color="primary">
                                    <Edit />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete User">
                                <IconButton 
                                    size="small" 
                                    color="error"
                                    onClick={() => handleDeleteUser(user.authid)}
                                >
                                    <Delete />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </ListItem>
                ))}
            </List>

            <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Create New Employee</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <TextField
                            label="Username"
                            value={newEmployee.username}
                            onChange={(e) => setNewEmployee({...newEmployee, username: e.target.value})}
                            fullWidth
                        />
                        <TextField
                            label="Email"
                            type="email"
                            value={newEmployee.email}
                            onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})}
                            fullWidth
                        />
                        <TextField
                            label="Password"
                            type="password"
                            value={newEmployee.password}
                            onChange={(e) => setNewEmployee({...newEmployee, password: e.target.value})}
                            fullWidth
                        />
                        <FormControl fullWidth>
                            <InputLabel>Role</InputLabel>
                            <Select
                                value={newEmployee.role}
                                onChange={(e) => setNewEmployee({...newEmployee, role: e.target.value})}
                            >
                                <MenuItem value="manager">Manager</MenuItem>
                                <MenuItem value="producthead">Product Head</MenuItem>
                                <MenuItem value="deliveryassistant">Delivery Assistant</MenuItem>
                            </Select>
                        </FormControl>
                        {(newEmployee.role === 'manager' || newEmployee.role === 'producthead' || newEmployee.role === 'deliveryassistant') && (
                            <FormControl fullWidth>
                                <InputLabel>Assign to Shops</InputLabel>
                                <Select
                                    multiple
                                    value={newEmployee.shopIds}
                                    onChange={(e) => setNewEmployee({...newEmployee, shopIds: e.target.value as number[]})}
                                >
                                    {shops.map((shop) => (
                                        <MenuItem key={shop.id} value={shop.id}>
                                            {shop.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
                    <Button 
                        onClick={handleCreateEmployee}
                        variant="contained"
                        disabled={!newEmployee.username || !newEmployee.email || !newEmployee.password || !newEmployee.role}
                    >
                        Create Employee
                    </Button>
                </DialogActions>
            </Dialog>
        </Card>
    );
}