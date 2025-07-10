"use client";

import {
    Box,
    TextField,
    Typography,
    Button,
    Alert,
    CircularProgress,
    Card
  } from "@mui/material";
  import { useState, useEffect } from "react";
  import Nav from "@/components/Nav";
  import axios from "axios";
import { useAuth } from "@/components/AuthProvider";
  
  export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [username, setUsername] = useState("");
    const [houseNumber, setHouseNumber] = useState("");
    const [streetAddress, setStreetAddress] = useState("");
    const [addressLine2, setAddressLine2] = useState("");
    const [city, setCity] = useState("");
    const [pinCode, setPinCode] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [latitude, setLatitude] = useState("");
    const [longitude, setLongitude] = useState("");
    const { isAuthenticated, user } = useAuth();
  
    useEffect(() => {
      
      const verifyAuth = async () => {
        try {
          if (isAuthenticated && user) {
            axios.get("/api/user_settings", {
            }).then(({ data }) => {
            setUsername(data.username || "");
            const addr = data.homeLoc || {};
            setHouseNumber(addr.house_number || "");
            setStreetAddress(addr.street_address || "");
            setAddressLine2(addr.address_line2 || "");
            setCity(addr.city || "");
            setPinCode(addr.pin_code || "");
            setLatitude(addr.latitude || null);
            setLongitude(addr.longitude || null);
            setLoading(false);
            });
          }
          // Fetch existing settings
        } catch (err) {
        console.error("Auth verification failed:", err);
        }
    }
    
    
    verifyAuth();
    }, [isAuthenticated, user]);
  
    const handleSubmit = async () => {
      const payload = {
        username,
        homeLoc: {
          house_number: houseNumber,
          street_address: streetAddress,
          address_line2: addressLine2,
          city,
          pin_code: pinCode,
          latitude: latitude || null,
          longitude: longitude || null
        },
      };
      const res = await axios.post("/api/user_settings", payload);
      if (res.status === 200) setSuccessMsg("Settings updated successfully!");
    };

    if (loading) {
      return (
        <>
          <Nav navType={isAuthenticated ? "customer" : "landing"} />
          <Box textAlign="center" mt={6}>
            <CircularProgress />
          </Box>
        </>
      );
    }
    
    return (
    <>
    <Nav navType={isAuthenticated ? "customer" : "landing"} />
      <Card raised={true} sx={{ maxWidth: 500, mx: "auto", mt: 5, p: 4, backgroundColor: "rgba(255, 255, 255, 0.3)" }}>
        <Typography variant="h5" gutterBottom>
          User Settings
        </Typography>
  
        <TextField
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          fullWidth
          sx={{ mb: 3 }}
        />
  
        <Typography variant="h6" gutterBottom>
          Default Delivery Address
        </Typography>
  
        <TextField
          fullWidth
          label="House Number"
          value={houseNumber}
          onChange={(e) => setHouseNumber(e.target.value)}
          error={!houseNumber.trim()}
          helperText={!houseNumber.trim() && "House number is required"}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          label="Street Address"
          value={streetAddress}
          onChange={(e) => setStreetAddress(e.target.value)}
          error={!streetAddress.trim()}
          helperText={!streetAddress.trim() && "Street address is required"}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          label="Address Line 2"
          value={addressLine2}
          onChange={(e) => setAddressLine2(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          label="City"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          error={!city.trim()}
          helperText={!city.trim() && "City is required"}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          label="PIN Code"
          value={pinCode}
          onChange={(e) => setPinCode(e.target.value)}
          error={!/^\d{6}$/.test(pinCode)}
          helperText={!/^\d{6}$/.test(pinCode) && "Enter a valid 6-digit PIN code"}
        />
  
        <Button variant="contained" sx={{ my: 2 }} fullWidth onClick={handleSubmit}>
          Save Changes
        </Button>
  
        {successMsg && (
          <Alert severity="success" sx={{ mt: 3 }}>
            {successMsg}
          </Alert>
        )}
      </Card>
</>
    );
  }
  