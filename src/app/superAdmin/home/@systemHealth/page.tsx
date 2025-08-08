"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import Card from "@/components/dashCard";
import { 
    Typography, 
    Box, 
    TextField,
    Button,
    Switch,
    FormControlLabel,
    Grid,
    Alert,
    CircularProgress
} from "@mui/material";
import { Settings, Save } from "@mui/icons-material";

interface PlatformSettings {
    platform_fee: string;
    del_charge_per_km: string;
    tax_rate_percent: string;
    max_del_distance: string;
    support_email: string;
    support_phone: string;
    is_maintenance_mode?: string;
}

export default function SystemHealth() {
    const [settings, setSettings] = useState<PlatformSettings>({
        platform_fee: '0',
        del_charge_per_km: '0',
        tax_rate_percent: '0',
        max_del_distance: '0',
        support_email: '',
        support_phone: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await axios.get('/api/superadmin/platform-settings');
            setSettings(response.data);
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSettings = async () => {
        setSaving(true);
        try {
            await axios.post('/api/superadmin/platform-settings', { settings });
            setMessage({ type: 'success', text: 'Settings saved successfully!' });
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            console.error('Error saving settings:', error);
            setMessage({ type: 'error', text: 'Failed to save settings' });
            setTimeout(() => setMessage(null), 3000);
        } finally {
            setSaving(false);
        }
    };

    const handleSettingChange = (key: keyof PlatformSettings, value: string) => {
        setSettings(prev => ({ ...prev, [key]: value }));
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
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Settings sx={{ mr: 1, color: '#054116' }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Platform Settings
                </Typography>
            </Box>

            {message && (
                <Alert severity={message.type} sx={{ mb: 2 }}>
                    {message.text}
                </Alert>
            )}

            <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Platform Fee (₹)"
                            type="number"
                            value={settings.platform_fee}
                            onChange={(e) => handleSettingChange('platform_fee', e.target.value)}
                            fullWidth
                            size="small"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Delivery Charge per KM (₹)"
                            type="number"
                            value={settings.del_charge_per_km}
                            onChange={(e) => handleSettingChange('del_charge_per_km', e.target.value)}
                            fullWidth
                            size="small"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Tax Rate (%)"
                            type="number"
                            value={settings.tax_rate_percent}
                            onChange={(e) => handleSettingChange('tax_rate_percent', e.target.value)}
                            fullWidth
                            size="small"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Max Delivery Distance (KM)"
                            type="number"
                            value={settings.max_del_distance}
                            onChange={(e) => handleSettingChange('max_del_distance', e.target.value)}
                            fullWidth
                            size="small"
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            label="Support Email"
                            type="email"
                            value={settings.support_email}
                            onChange={(e) => handleSettingChange('support_email', e.target.value)}
                            fullWidth
                            size="small"
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            label="Support Phone"
                            value={settings.support_phone}
                            onChange={(e) => handleSettingChange('support_phone', e.target.value)}
                            fullWidth
                            size="small"
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <FormControlLabel
                            control={
                                <Switch 
                                    checked={settings.is_maintenance_mode === 'true'}
                                    onChange={(e) => handleSettingChange('is_maintenance_mode', e.target.checked ? 'true' : 'false')}
                                />
                            }
                            label="Maintenance Mode"
                        />
                    </Grid>
                </Grid>
            </Box>

            <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Button
                    variant="contained"
                    startIcon={saving ? <CircularProgress size={20} /> : <Save />}
                    onClick={handleSaveSettings}
                    disabled={saving}
                    sx={{ backgroundColor: '#054116' }}
                >
                    {saving ? 'Saving...' : 'Save Settings'}
                </Button>
            </Box>
        </Card>
    );
}