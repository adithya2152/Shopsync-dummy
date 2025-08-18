"use client";

import {
    Box,
    TextField,
    Typography,
    Button,
    Alert,
    CircularProgress,
    Card,
    IconButton,
    Stack,
    Grid,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from "@mui/material";
import { useState, useEffect, Fragment } from "react";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CancelIcon from '@mui/icons-material/Cancel';
import toast, { Toaster } from "react-hot-toast";
import axios from "axios";
import Nav from "@/components/Nav";
import { supabase } from "@/util/supabase";
import PWAFeatures from "@/components/PWAFeatures";


type Address = {
    id: string;
    label: string;
    house_number: string;
    street_address: string;
    address_line2: string;
    city: string;
    pin_code: string;
    latitude: number | null;
    longitude: number | null;
};


type UserSettings = {
    username: string;
    addresses: Address[];
    Phone: string;
};

// --- Main Component ---

export default function SettingsPage() {
    const [navType, setNavType] = useState<"landing" | "customer">("landing");
    const [loading, setLoading] = useState(true);
    const [successMsg, setSuccessMsg] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [authId, setAuthId] = useState("");
    const [revGeocodeButtonVisible, setButtonVisible] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);


    // Consolidated state for all user settings
    const [settings, setSettings] = useState<UserSettings>({
      username: "",
      addresses: [],
      Phone: "",
    });
    
    // State to hold the original settings to allow for cancellation of edits
    const [originalSettings, setOriginalSettings] = useState<UserSettings | null>(null);
    
    // State to control which address is in edit mode. Value is the address 'id'.
    const [editModeId, setEditModeId] = useState<string | null>(null);
    
    const revGeocodeCallback = async (latitude: number, longitude: number) => {
      try {
          const resp = await axios.get(`/api/reverseGeocode?latitude=${latitude}&longitude=${longitude}`);
          
          const { formattedAddress, city, zipcode } = resp.data[0];
  
          setSettings(prev => {
              // Guard clause: Do nothing if there are no addresses to update.
              if (prev.addresses.length === 0) {
                  return prev;
              }
  
              // Create a new, updated version of the first address.
              const updatedFirstAddress = {
                  ...prev.addresses[0], // Keep existing fields like label
                  street_address: formattedAddress,
                  city: city,
                  pin_code: zipcode,
                  latitude: latitude,
                  longitude: longitude
              };

              console.log("Updated Address from Coordinates:", updatedFirstAddress);
  
              // Return the new state with the updated first address and the rest of the addresses untouched.
              return {
                  ...prev,
                  addresses: [updatedFirstAddress, ...prev.addresses.slice(1)]
              };
          });
  
          setSuccessMsg("Address updated from coordinates!");
          // Since we know it's the first address, we can hardcode the ID for edit mode.
          setEditModeId("address1"); 
          setButtonVisible(false);
  
      } catch (error) {
          console.error("Reverse geocoding failed:", error);
          setErrorMsg("Failed to fetch address from coordinates. Please try again.");
      }
  };

    useEffect(() => {
        const verifyAndFetchData = async () => {
            setLoading(true);
            try {
                // Step 1: Check user cookies to get the auth ID
                const cookieRes = await fetch("/api/get_user");
                if (!cookieRes.ok) throw new Error("Could not fetch user session.");
                
                const { id } = await cookieRes.json();
                setAuthId(id);

                // Step 2: Check authentication status
                const authRes = await fetch("/api/auth/is_auth");
                if (authRes.ok) {
                    const { authenticated } = await authRes.json();
                    if (authenticated) setNavType("customer");
                }

                // Step 3: Fetch user settings from the backend
                const { data } = await axios.get("/api/user_settings", {
                    headers: { authid: id },
                });

                // Step 4: Transform API data into the client-side state structure
                const fetchedAddresses: Address[] = [];
                if (data.homeLoc) {
                    if (data.homeLoc.latitude !== null && data.homeLoc.longitude !== null && !data.homeLoc.street_address) {
                        // If latitude and longitude are present but street address is missing, show the button
                        setButtonVisible(true);

                    }
                    fetchedAddresses.push({ id: 'address1', ...data.homeLoc });
                }
                if (data.homeLoc2) {
                    fetchedAddresses.push({ id: 'address2', ...data.homeLoc2 });
                }

                const initialSettings = {
                    username: data.username || "",
                    Phone: data.Phone || "",
                    addresses: fetchedAddresses,
                };

                setSettings(initialSettings);
                setOriginalSettings(JSON.parse(JSON.stringify(initialSettings))); // Deep copy for reset functionality

            } catch (err) {
                console.error("Initialization failed:", err);
                setErrorMsg("Failed to load user settings. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        verifyAndFetchData();
    }, []);
    
    /**
     * Handles changes to any text field and updates the state immutably.
     */
    const handleFieldChange = (
        section: 'username' | 'address' | 'Phone',
        index: number,
        field: keyof Address | 'username' | 'Phone',
        value: string
    ) => {
        setSettings(prev => {
            if (section === 'username') {
                return { ...prev, username: value };
            }
            if (section === 'Phone') {
                return { ...prev, Phone: value };
            }
            // Create a new array for addresses to ensure immutability
            const newAddresses = [...prev.addresses];
            // Update the specific field of the specific address
            newAddresses[index] = { ...newAddresses[index], [field]: value };
            return { ...prev, addresses: newAddresses };
        });
    };
    
    /**
     * Adds a new, empty address form, ready for editing.
     */
    const handleAddAddress = () => {
        if (settings.addresses.length < 2) {
            const newAddress: Address = {
                id: `address${settings.addresses.length + 1}`,
                label: 'New Address',
                house_number: '',
                street_address: '',
                address_line2: '',
                city: '',
                pin_code: '',
                latitude: null,
                longitude: null,
            };
            setSettings(prev => ({ ...prev, addresses: [...prev.addresses, newAddress] }));
            setEditModeId(newAddress.id); // Enter edit mode for the new address
        }
    };

    /**
     * Deletes an address from the state. This change is only persisted on Save.
     */
    const handleDeleteAddress = (idToDelete: string) => {
        setSettings(prev => ({
            ...prev,
            addresses: prev.addresses.filter(addr => addr.id !== idToDelete)
        }));
        // If the deleted address was in edit mode, exit edit mode.
        if (editModeId === idToDelete) {
            setEditModeId(null);
        }
    };
    
    /**
     * Cancels the edit operation for a specific address, reverting its state.
     */
    const handleCancelEdit = () => {
        setSettings(originalSettings!); // Revert all changes to original state
        setEditModeId(null);
    };

    /**
     * Submits all changes to the backend.
     */
    const handleSubmit = async () => {
        setLoading(true);
        setErrorMsg("");
        setSuccessMsg("");

        // Transform client-side state back to the API payload structure
        const payload: {
            username: string;
            Phone: string;
            authid: string;
            homeLoc: Address | null;
            homeLoc2: Address | null;
        } = {
            username: settings.username,
            Phone: settings.Phone,
            authid: authId,
            homeLoc: null,
            homeLoc2: null,
        };

        if (settings.addresses[0]) {
            const addressData = settings.addresses[0];
            payload.homeLoc = addressData;
        }
        if (settings.addresses[1]) {
            const addressData = settings.addresses[1];
            payload.homeLoc2 = addressData;
        }
        
        try {
            await axios.post("/api/user_settings", payload);
            setSuccessMsg("Settings updated successfully!");
            setOriginalSettings(JSON.parse(JSON.stringify(settings))); // Set new original state
            setEditModeId(null); // Exit edit mode
        } catch (error) {
            console.error("Failed to update settings:", error);
            toast.error("Failed to update settings.");
            setErrorMsg("An error occurred while saving. Please try again.");
        } finally {
            setLoading(false);
            toast.success("Settings saved successfully!");
        }
    };



    if (loading && !settings.username) {
        return (
            <>
                <Nav navType={navType} />
                <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
                    <CircularProgress />
                </Box>
            </>
        );
    }

    return (
        <>
            <Nav navType={navType} />
            <Box component="main" sx={{ p: { xs: 2, sm: 3 } }}>
                <Card raised={true} sx={{ maxWidth: 700, backgroundColor: 'rgba(26, 35, 126, 0.03)', mx: "auto", p: { xs: 2, md: 4 } }}>
                    <Typography variant="h4" component="h1" gutterBottom>
                        User Settings
                    </Typography>

                    <Typography variant="h6" gutterBottom>Profile</Typography>
                    <TextField
                        label="Username"
                        value={settings.username}
                        onChange={(e) => handleFieldChange('username', 0, 'username', e.target.value)}
                        fullWidth
                        error={settings.username === ""}
                        helperText={settings.username === "" && "Username cannot be empty"}
                        sx={{ mb: 4 }}
                    />
                    <TextField
                        label="Phone"
                        value={settings.Phone}
                        onChange={(e) => handleFieldChange('Phone', 0, 'Phone', e.target.value)}
                        error={!/^\d{10}$/.test(settings.Phone)} helperText={!/^\d{10}$/.test(settings.Phone) && "Enter a valid 10-digit Phone number"}
                        fullWidth
                        sx={{ mb: 4 }}
                    />
                

                    <Button onClick={() => setDialogOpen(true)}>Change Password</Button>
                    <ChangePasswordDialog open={dialogOpen} setOpen={setDialogOpen} />
                    
                    <Divider sx={{ my: 2 }} />

                    <Typography variant="h6" component="h2" gutterBottom>
                        Your Addresses
                    </Typography>

                    {settings.addresses.map((address, index) => {
                        const isEditing = editModeId === address.id;
                        return (
                            <Box key={address.id} sx={{ mb: 3, p: 2, border: '1px solid', borderRadius: 2, position: 'relative' }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                                    <Typography variant="h6" component="h3">
                                        {isEditing ? 'Editing Address' : address.label || `Address ${index + 1}`}
                                    </Typography>
                                    <Box>
                                        {index === 0 && revGeocodeButtonVisible && (
                                            <Button 
                                                variant="outlined" 
                                                onClick={() => revGeocodeCallback(address.latitude!, address.longitude!)} 
                                                sx={{ mr: 1 }}
                                            >
                                                Autofill Address
                                            </Button>
                                        )}
                                        {isEditing ? (
                                            <>
                                                <Button onClick={handleSubmit} variant="contained" aria-label="save">
                                                    Save
                                                </Button>
                                                <IconButton onClick={() => handleCancelEdit()} aria-label="cancel">
                                                    <CancelIcon />
                                                </IconButton>
                                            </>
                                        ) : (
                                            <>
                                                 <IconButton onClick={() => setEditModeId(address.id)} color="primary" aria-label="edit">
                                                    <EditIcon />
                                                </IconButton>
                                                {index > 0 && (
                                                <IconButton onClick={() => handleDeleteAddress(address.id)} color="error" aria-label="delete">
                                                    <DeleteIcon />
                                                </IconButton>
                                                )}
                                            </>
                                        )}
                                    </Box>
                                </Stack>

                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <TextField fullWidth label="Address Label (e.g. Home, Work)" value={address.label} onChange={(e) => handleFieldChange('address', index, 'label', e.target.value)} disabled={!isEditing} />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField fullWidth label="House Number" value={address.house_number} onChange={(e) => handleFieldChange('address', index, 'house_number', e.target.value)} disabled={!isEditing} error={isEditing && !/\S/.test(address.house_number)} helperText={isEditing && !/\S/.test(address.house_number) && "Enter a valid house number"} />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField fullWidth label="Street Address" value={address.street_address} onChange={(e) => handleFieldChange('address', index, 'street_address', e.target.value)} disabled={!isEditing} error={isEditing && !/\S/.test(address.street_address)} helperText={isEditing && !/\S/.test(address.street_address) && "Enter a valid street address "}/>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField fullWidth label="Address Line 2" value={address.address_line2} onChange={(e) => handleFieldChange('address', index, 'address_line2', e.target.value)} disabled={!isEditing} error={isEditing && !/\S/.test(address.address_line2)} helperText={isEditing && !/\S/.test(address.address_line2) && "Enter a valid address line 2"}/>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField fullWidth label="City" value={address.city} onChange={(e) => handleFieldChange('address', index, 'city', e.target.value)} disabled={!isEditing} error={isEditing && !/\S/.test(address.city)} helperText={isEditing && !/\S/.test(address.city) && "Enter a valid city name"}/>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField fullWidth label="PIN Code" value={address.pin_code} onChange={(e) => handleFieldChange('address', index, 'pin_code', e.target.value)} disabled={!isEditing} error={isEditing && !/^\d{6}$/.test(address.pin_code)} helperText={isEditing && !/^\d{6}$/.test(address.pin_code) && "Enter a valid 6-digit PIN code"} />
                                    </Grid>
                                </Grid>
                            </Box>
                        );
                    })}
                    
                    {settings.addresses.length < 2 && (
                        <Button variant="outlined" onClick={handleAddAddress} sx={{ mt: 2 }}>
                            Add New Address
                        </Button>
                    )}

                    <Button 
                        variant="contained" 
                        sx={{ mt: 4 }} 
                        fullWidth 
                        onClick={handleSubmit}
                        disabled={loading || !!editModeId || !settings.username || !settings.Phone}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Save All Changes'}
                    </Button>

                    {successMsg && <Alert severity="success" sx={{ mt: 3 }}>{successMsg}</Alert>}
                    {errorMsg && <Alert severity="error" sx={{ mt: 3 }}>{errorMsg}</Alert>}
                </Card>
                
                {/* PWA Features Section */}
                <Card raised={true} sx={{ maxWidth: 700, backgroundColor: 'rgba(26, 35, 126, 0.03)', mx: "auto", p: { xs: 2, md: 4 }, mt: 4 }}>
                    <PWAFeatures />
                </Card>
            </Box>
        <Toaster />
        </>
    );
}

function ChangePasswordDialog({
    open,
    setOpen,
  }: {
    open: boolean;
    setOpen: (open: boolean) => void;
  }) {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
  
    const handleSubmit = async () => {
      setError("");
      setSuccess("");
  
      if (!currentPassword || !newPassword || !confirmPassword) {
        setError("Please fill in all fields.");
        return;
      }
  
      if (newPassword !== confirmPassword) {
        setError("New passwords do not match.");
        return;
      }
  
      setLoading(true);
  
      // ✅ Get user's email from session
      const {
        data: { session },
      } = await supabase.auth.getSession();
  
      const email = session?.user?.email;
      if (!email) {
        setError("User session not found.");
        setLoading(false);
        return;
      }
  
      // ✅ Re-authenticate using current password
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });
  
      if (loginError) {
        setError("Current password is incorrect.");
        setLoading(false);
        return;
      }
  
      // ✅ Now update to the new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
  
      if (updateError) {
        setError("Failed to update password.");
      } else {
        setOpen(false);
        toast.success("Password updated successfully!");
      }
  
      setLoading(false);
    };
  
    return (
      <Dialog open={open}>
        <DialogTitle sx={{ backgroundColor: '#5A9F6B80' }}>Change Password</DialogTitle>
        <DialogContent dividers sx={{ backgroundColor: '#5A9F6B80' }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
  
          <TextField
            type="password"
            label="Current Password"
            fullWidth
            margin="dense"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <TextField
            type="password"
            label="New Password"
            fullWidth
            margin="dense"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <TextField
            type="password"
            label="Confirm New Password"
            fullWidth
            margin="dense"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ backgroundColor: '#5A9F6B80' }}>
          <Button onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {loading ? "Updating..." : "Update Password"}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
  