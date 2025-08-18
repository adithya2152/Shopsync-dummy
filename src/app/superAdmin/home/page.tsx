"use client";

import React, { useState } from 'react';
import {
    Box,
    Container,
    Typography,
    Tabs,
    Tab,
    TextField,
    Button,
    Switch,
    FormControlLabel,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Tooltip,
} from "@mui/material";
import {
    Settings,
    Store,
    People,
    Edit,
    Delete,
    Visibility,
} from '@mui/icons-material';
import "@/styles/superadmin.css";

// --- Mock Data (Replace with API calls) ---
const mockSettings = {
    platform_fee: "15.50",
    delivery_charge_per_km: "10.00",
    tax_rate_percent: "18.00",
    currency_symbol: "₹",
    currency_code: "INR",
    is_maintenance_mode: false,
    support_email: "support@shopsync.com",
    support_phone: "+91 12345 67890",
};

const mockShops = [
    { id: 1, name: "Green Grocers", manager: "John Doe", status: "Active" },
    { id: 2, name: "Gadget Galaxy", manager: "Jane Smith", status: "Inactive" },
    { id: 3, name: "Book Barn", manager: "Peter Jones", status: "Active" },
];

const mockUsers = [
    { id: 1, username: "adithya", email: "adithya@example.com", role: "customer" },
    { id: 2, username: "john_manager", email: "john@example.com", role: "manager" },
    { id: 3, username: "super_admin", email: "admin@shopsync.com", role: "superadmin" },
];

// --- Tab Panel Component ---
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

// --- Main Super Admin Page Component ---
export default function SuperAdminPage() {
    const [tabValue, setTabValue] = useState(0);
    const [settings, setSettings] = useState(mockSettings);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const handleSettingsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = event.target;
        setSettings(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSaveSettings = () => {
        // In a real app, you would make an API call here to save the settings
        console.log("Saving settings:", settings);
        alert("Settings saved successfully!");
    };

    return (
        <div className="super-admin-container">
            <Container maxWidth="lg">
                <Typography variant="h3" gutterBottom sx={{ fontWeight: 'bold', color: '#054116' }}>
                    Super Admin Panel
                </Typography>
                
                <Paper elevation={3} sx={{ borderRadius: '16px', background: 'rgba(255, 255, 255, 0.3)', backdropFilter: 'blur(10px)' }}>
                    <Tabs value={tabValue} onChange={handleTabChange} centered>
                        <Tab icon={<Settings />} label="Platform Settings" />
                        <Tab icon={<Store />} label="Manage Shops" />
                        <Tab icon={<People />} label="Manage Users" />
                    </Tabs>
                </Paper>

                <TabPanel value={tabValue} index={0}>
                    <Box component="form" noValidate autoComplete="off">
                        <div className="settings-form-grid">
                            <div className="form-section">
                                <Typography variant="h6" gutterBottom>Financial Settings</Typography>
                                <TextField fullWidth margin="normal" label="Platform Fee (₹)" name="platform_fee" value={settings.platform_fee} onChange={handleSettingsChange} />
                                <TextField fullWidth margin="normal" label="Delivery Charge per KM (₹)" name="delivery_charge_per_km" value={settings.delivery_charge_per_km} onChange={handleSettingsChange} />
                                <TextField fullWidth margin="normal" label="Tax Rate (%)" name="tax_rate_percent" value={settings.tax_rate_percent} onChange={handleSettingsChange} />
                            </div>
                            <div className="form-section">
                                <Typography variant="h6" gutterBottom>Operational Settings</Typography>
                                <FormControlLabel
                                    control={<Switch checked={settings.is_maintenance_mode} onChange={handleSettingsChange} name="is_maintenance_mode" />}
                                    label="Maintenance Mode"
                                />
                                <Typography variant="caption" display="block">Enable this to temporarily disable access to the storefronts.</Typography>
                            </div>
                            <div className="form-section">
                                <Typography variant="h6" gutterBottom>Support Information</Typography>
                                <TextField fullWidth margin="normal" label="Support Email" name="support_email" value={settings.support_email} onChange={handleSettingsChange} />
                                <TextField fullWidth margin="normal" label="Support Phone" name="support_phone" value={settings.support_phone} onChange={handleSettingsChange} />
                            </div>
                        </div>
                        <Box sx={{ mt: 3, textAlign: 'right' }}>
                            <Button variant="contained" color="primary" onClick={handleSaveSettings} sx={{ backgroundColor: '#054116', '&:hover': { backgroundColor: '#043511' } }}>
                                Save All Settings
                            </Button>
                        </Box>
                    </Box>
                </TabPanel>

                <TabPanel value={tabValue} index={1}>
                    <TableContainer className="management-table-container">
                        <Table>
                            <TableHead className="management-table-header">
                                <TableRow>
                                    <TableCell>Shop ID</TableCell>
                                    <TableCell>Shop Name</TableCell>
                                    <TableCell>Manager</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {mockShops.map((shop) => (
                                    <TableRow key={shop.id}>
                                        <TableCell>{shop.id}</TableCell>
                                        <TableCell>{shop.name}</TableCell>
                                        <TableCell>{shop.manager}</TableCell>
                                        <TableCell>{shop.status}</TableCell>
                                        <TableCell align="right">
                                            <Tooltip title="View Details"><IconButton><Visibility /></IconButton></Tooltip>
                                            <Tooltip title="Edit Shop"><IconButton><Edit /></IconButton></Tooltip>
                                            <Tooltip title="Delete Shop"><IconButton color="error"><Delete /></IconButton></Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </TabPanel>

                <TabPanel value={tabValue} index={2}>
                    <TableContainer className="management-table-container">
                        <Table>
                            <TableHead className="management-table-header">
                                <TableRow>
                                    <TableCell>User ID</TableCell>
                                    <TableCell>Username</TableCell>
                                    <TableCell>Email</TableCell>
                                    <TableCell>Role</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {mockUsers.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>{user.id}</TableCell>
                                        <TableCell>{user.username}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>{user.role}</TableCell>
                                        <TableCell align="right">
                                            <Tooltip title="Edit User"><IconButton><Edit /></IconButton></Tooltip>
                                            <Tooltip title="Delete User"><IconButton color="error"><Delete /></IconButton></Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </TabPanel>
            </Container>
        </div>
    );
}
