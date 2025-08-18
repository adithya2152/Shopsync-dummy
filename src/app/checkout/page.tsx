"use client";

import { useState, useEffect, useCallback, useRef } from "react"; // Import useRef
import Image from 'next/image';
import Link from 'next/link';
import axios, { isAxiosError } from "axios";
import {
  Box,
  Button,
  Typography,
  Divider,
  IconButton,
  Paper,
  TextField,
  CircularProgress,
  FormControlLabel,
  Card,
  CardActionArea,
  CardContent,
  FormControl,
  FormLabel,
  Radio,
  RadioGroup
} from "@mui/material";
import RemoveIcon from "@mui/icons-material/Remove";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import toast, { Toaster } from "react-hot-toast";
import Nav from "@/components/Nav";

// --- TypeScript Type Definitions ---
interface EnrichedCartItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
  stock: number;
}

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

// --- Main Checkout Page Component ---
export default function CheckoutPage() {
  // --- State Management ---
  const [cart, setCart] = useState<EnrichedCartItem[]>([]);
  const [summary, setSummary] = useState({
    subtotal: 0,
    platformFees: 0,
    deliveryFees: 0,
    tax: 0,
    discountAmount: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [shopId, setShopId] = useState<number | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [orderId, setOrderId] = useState<number | null>(null);
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [deliveryError, setDeliveryError] = useState<string | null>(null);
  
  // FIX: Ref to track the initial mount and prevent the update effect from running on load.
  const isInitialMount = useRef(true);

  // --- Data Fetching and Side Effects ---

  // Effect for initial data load (runs only once)
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [userSettingsRes] = await Promise.all([
          axios.get("/api/user_settings"),
          axios.get("/api/auth/is_auth"),
        ]);

        const { data: userSettings } = userSettingsRes;
        
        const fetchedAddresses: Address[] = [];
        if (userSettings.homeLoc && Object.keys(userSettings.homeLoc).length > 0) {
          fetchedAddresses.push({ id: 'address1', ...userSettings.homeLoc });
        }
        if (userSettings.homeLoc2 && Object.keys(userSettings.homeLoc2).length > 0) {
          fetchedAddresses.push({ id: 'address2', ...userSettings.homeLoc2 });
        }
        console.log("Fetched Addresses:", fetchedAddresses);
        setAddresses(fetchedAddresses);
        
        const defaultAddressId = fetchedAddresses.length > 0 ? fetchedAddresses[0].id : null;
        setSelectedAddressId(defaultAddressId);

        const storedCart = localStorage.getItem("cart");
        const storedShopId = localStorage.getItem("currentShopId");
        
        if (!storedCart || !storedShopId) {
            setLoading(false);
            return;
        }

        const parsedCart = JSON.parse(storedCart);
        const parsedShopId = parseInt(storedShopId, 10);
        setShopId(parsedShopId);
        setCart(parsedCart);

        const usedAddress = fetchedAddresses.find(addr => addr.id === defaultAddressId) || fetchedAddresses[0];
        if (!usedAddress) {
            setDeliveryError("Please add a delivery address to your profile.");
            setLoading(false);
        }
        if (usedAddress) {
            const summaryResponse = await axios.post("/api/checkout/summary", {
                cart: parsedCart,
                shopId: parsedShopId,
                homeLoc: { latitude: usedAddress.latitude, longitude: usedAddress.longitude },
            });
            
            const { data } = summaryResponse;
            setSummary({
                subtotal: data.subtotal || 0,
                platformFees: data.platformFees || 0,
                deliveryFees: data.deliveryFees || 0,
                tax: data.tax || 0,
                discountAmount: data.discountAmount || 0,
                total: data.total || 0,
            });
            setCart(data.cart);
            console.log(data.cart);
        }
      } catch (err) {
        if (isAxiosError(err) && err.response?.data.errorType === "cart") {
          setDeliveryError(err.response.data.error);
        }
        toast.error("Could not load checkout data.");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // --- Core Logic Functions (Memoized) ---
  const refreshCart = useCallback(async () => {
    const storedShopId = localStorage.getItem("currentShopId");
    if (cart.length === 0 || !storedShopId) return;

    setLoading(true);
    localStorage.setItem("cart", JSON.stringify(cart));
    
    const usedAddress = addresses.find(addr => addr.id === selectedAddressId) || addresses[0];
    if (!usedAddress) {
        setLoading(false);
        return;
    }

    try {
      const response = await axios.post("/api/checkout/summary", {
        cart,
        shopId: parseInt(storedShopId, 10),
        coupon: couponCode || null,
        homeLoc: { latitude: usedAddress.latitude, longitude: usedAddress.longitude },
      });

      const { data } = response;
      setSummary({
        subtotal: data.subtotal || 0,
        platformFees: data.platformFees || 0,
        deliveryFees: data.deliveryFees || 0,
        tax: data.tax || 0,
        discountAmount: data.discountAmount || 0,
        total: data.total || 0,
      });

      if (couponCode) setCouponCodeInput(couponCode);
      
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data.errorType === "coupon") {
        toast.error(err.response.data.error);
        setCouponCodeInput("");
        setCouponCode("");
      } else if (axios.isAxiosError(err) && err.response?.data.errorType === "cart") {
        setDeliveryError(err.response.data.error);
      } else {
        toast.error("Failed to update cart summary.");
      }
    } finally {
        setLoading(false);
    }
  }, [cart, couponCode, addresses, selectedAddressId]);

  // FIX: This effect now safely handles updates without causing an infinite loop.
  useEffect(() => {
    // Use the ref to check if this is the initial render.
    // If it is, we skip the effect because data is already being fetched.
    if (isInitialMount.current) {
        isInitialMount.current = false; // Toggle the ref for subsequent renders
        return;
    }

    // On any subsequent change to cart, coupon code, or selected address,
    // this effect will run and call the refresh function.
    refreshCart();

  }, [cart, couponCode, selectedAddressId, refreshCart]); // Dependencies are the triggers for a refresh.

  const addToCart = (productId: number) => {
    const product = cart.find(item => item.id === productId);
    if (product && product.quantity + 1 > product.stock) {
      toast.error("You have reached the maximum stock limit for this product.");
      return;
    }
    setCart(prev => prev.map(item => item.id === productId ? { ...item, quantity: item.quantity + 1 } : item));
  };

  const removeFromCart = useCallback((productId: number) => {
    setCart(prev => prev.map(item => item.id === productId ? { ...item, quantity: item.quantity - 1 } : item).filter(item => item.quantity > 0));
  }, []);

  const handleApplyCoupon = useCallback(() => {
    if (couponCodeInput.trim()) {
      setCouponCode(couponCodeInput.trim());
    }
  }, [couponCodeInput]);

  const handleRemoveCoupon = useCallback(() => {
    setCouponCode("");
    setCouponCodeInput("");
  }, []);

  const placeOrder = useCallback(async () => {
    setLoading(true);
    if (paymentMethod !== "cod") {
      toast.error("Only Cash on Delivery is supported at this time.");
      return;
    }
    const selectedAddressObject = addresses.find(addr => addr.id === selectedAddressId);
    if (!selectedAddressObject) {
      toast.error("Please select a valid delivery address.");
      return;
    }
    
    const { id, ...addressToSend } = selectedAddressObject; // eslint-disable-line

    try {
        const resp = await axios.post("/api/place_order", { cart, shopId, coupon: couponCode, address: addressToSend, paymentMethod });
        if (resp.status === 201) {
            const orderId = resp.data.orderId;
            setCart([]);
            localStorage.removeItem("cart");
            toast.success(`Order placed successfully! Order ID: ${orderId}`);
            setOrderId(orderId);
        }
    } catch (error) {
        toast.error("Failed to place order. Please try again.");
        console.error("Place order error:", error);
    }
    setLoading(false);
  }, [cart, shopId, couponCode, selectedAddressId, addresses, paymentMethod]);
  
  const formatAddress = (addr: Address) => {
    return [addr.house_number, addr.street_address, addr.address_line2, addr.city, addr.pin_code].filter(Boolean).join(', ');
  };
  
  const paymentOptions = [
    { value: "upi", label: "Any UPI App", sub: "Google Pay, PhonePe, Paytm, etc.", img: "/images/upi.png" },
    { value: "cod", label: "Cash/Pay on Delivery", sub: "Pay cash or UPI when your order arrives" },
  ];

  if (deliveryError) {
    return (
      <>
        <Nav navType="customer" />
        <Box textAlign="center" mt={4}>
          <Typography variant="h6">{deliveryError}</Typography>
          <Box sx={{ border: "1px solid #ccc", borderRadius: 2, p: 3, maxWidth: 500, mx: "auto", mt: 4 }}>
            <FormControl component="fieldset" fullWidth>
                <FormLabel component="legend" sx={{ typography: 'h6', mb: 2 }}>Select Delivery Address</FormLabel>
                {addresses.length > 0 ? (
                    <RadioGroup value={selectedAddressId} onChange={(e) => {setDeliveryError(null); setSelectedAddressId(e.target.value)}}>
                        {addresses.map((addr) => (
                            <FormControlLabel
                                key={addr.id} value={addr.id} control={<Radio />}
                                label={
                                    <Box sx={{ ml: 1 }}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{addr.label || `Address ${addr.id.slice(-1)}`}</Typography>
                                        <Typography variant="body2" color="text.secondary">{formatAddress(addr)}</Typography>
                                    </Box>
                                }
                                sx={{ border: '1px solid', borderColor: selectedAddressId === addr.id ? 'primary.main' : 'grey.300', borderRadius: 1, m: 0, mb: 1, p: 1, '&:hover': { borderColor: 'primary.light' } }}
                            />
                        ))}
                    </RadioGroup>
                ) : (
                    <Typography color="text.secondary">No addresses found. Please add an address to your profile.</Typography>
                )}
            </FormControl>
            <Button component={Link} href="/profile" variant="outlined" size="small" sx={{ mt: 2 }}>Add or Edit Addresses</Button>
          </Box>
          <Button variant="contained" href="/" sx={{ mt: 2 }}>Back to home</Button>
        </Box>
      </>
    );
  }


  // --- UI Rendering (No changes below this line) ---
  if (loading && cart.length === 0) {
    return (
      <><Nav navType="landing" /><Box textAlign="center" mt={6}><CircularProgress /></Box></>
    );
  }

  if (orderId) {
    return (
      <>
        <Nav navType="customer" />
        <Box textAlign="center" mt={4}>
          <Typography variant="h3">Thank You for Your Order!</Typography>
          <Typography variant="h6">Your order has been placed successfully! Your order ID is {orderId}.</Typography>
          <Button variant="contained" href="/" sx={{ mt: 2 }}>Continue Shopping</Button>
          <Button variant="outlined" href="/history" sx={{ mt: 2, ml: 2 }}>View Orders</Button>
        </Box>
      </>
    );
  }
  
  if (cart.length === 0 && !loading) {
    return (
      <>
        <Nav navType="landing" />
        <Box textAlign="center" mt={4}>
          <Typography variant="h6">Your cart is empty. Please add items to your cart before checking out.</Typography>
          <Button variant="contained" href="/" sx={{ mt: 2 }}>Shop Now</Button>
        </Box>
      </>
    );
  } 

  return (
    <>
      <Nav navType="customer" />
      <Toaster position="top-center" reverseOrder={false} />
      <Typography variant="h4" align="center" gutterBottom>Checkout Order</Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 4, p: 4 }}>
        {/* Left Panel */}
        <Box sx={{ flex: 3, minWidth: 300 }}>
          <Typography variant="h5" gutterBottom>Items in your cart:</Typography>
          <Divider sx={{ mb: 2 }} />

          {cart.map(item => (
            <Paper
              key={item.id}
              sx={{
                mb: 2, p: 2, display: "flex", justifyContent: "space-between", alignItems: "center",
                backgroundColor: "rgba(255, 255, 255, 0.3)"
              }}
            >
              <Box>
                <Typography variant="h6">{item.name}</Typography>
                <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                  <IconButton onClick={() => removeFromCart(item.id)} size="small">
                    {item.quantity === 1 ? <DeleteIcon /> : <RemoveIcon />}
                  </IconButton>
                  <Typography sx={{ mx: 2 }}>{item.quantity}</Typography>
                  <IconButton onClick={() => addToCart(item.id)} size="small"><AddIcon /></IconButton>
                </Box>
              </Box>
              <Typography variant="subtitle1">₹{(item.quantity * item.price).toFixed(2)}</Typography>
            </Paper>
          ))}

          <Divider sx={{ mt: 4, mb: 2 }} />
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="h6">Subtotal:</Typography>
            <Typography variant="h6">₹{summary.subtotal.toFixed(2)}</Typography>
          </Box>

          <Divider sx={{ mt: 4, mb: 2 }} />
          
          <Box sx={{ border: "1px solid #ccc", borderRadius: 2, p: 3 }}>
            <FormControl component="fieldset" fullWidth>
                <FormLabel component="legend" sx={{ typography: 'h6', mb: 2 }}>Select Delivery Address</FormLabel>
                {addresses.length > 0 ? (
                    <RadioGroup value={selectedAddressId} onChange={(e) => setSelectedAddressId(e.target.value)}>
                        {addresses.map((addr) => (
                            <FormControlLabel
                                key={addr.id} value={addr.id} control={<Radio />}
                                label={
                                    <Box sx={{ ml: 1 }}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{addr.label || `Address ${addr.id.slice(-1)}`}</Typography>
                                        <Typography variant="body2" color="text.secondary">{formatAddress(addr)}</Typography>
                                    </Box>
                                }
                                sx={{ border: '1px solid', borderColor: selectedAddressId === addr.id ? 'primary.main' : 'grey.300', borderRadius: 1, m: 0, mb: 1, p: 1, '&:hover': { borderColor: 'primary.light' } }}
                            />
                        ))}
                    </RadioGroup>
                ) : (
                    <Typography color="text.secondary">No addresses found. Please add an address to your profile.</Typography>
                )}
            </FormControl>
            <Button component={Link} href="/profile" variant="outlined" size="small" sx={{ mt: 2 }}>Add or Edit Addresses</Button>
          </Box>
        </Box>

        {/* Right Panel */}
        <Box sx={{ flex: 1, minWidth: 300, display: "flex", flexDirection: "column", gap: 3 }}>
          <Box sx={{ border: "1px solid #ccc", borderRadius: 2, p: 3 }}>
            <Typography variant="h6" gutterBottom>Have a coupon code?</Typography>
            <TextField size="small" fullWidth placeholder="Enter code" value={couponCodeInput} onChange={(e) => setCouponCodeInput(e.target.value)} sx={{ mb: 2 }}/>
            {couponCode ? (
              <Button variant="outlined" fullWidth onClick={handleRemoveCoupon} sx={{ mb: 2 }}>Remove Coupon</Button>
            ) : (
            <Button variant="contained" onClick={handleApplyCoupon} fullWidth disabled={!couponCodeInput.trim() || loading}>Apply Code</Button>
            )}
          </Box>

          <Box sx={{ border: "1px solid #ccc", borderRadius: 2, p: 3 }}>
            <Typography variant="h6" gutterBottom>Summary</Typography>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}><Typography>Items Subtotal</Typography><Typography>₹{summary.subtotal.toFixed(2)}</Typography></Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}><Typography>Platform Fees</Typography><Typography>₹{summary.platformFees.toFixed(2)}</Typography></Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}><Typography>Delivery Fees</Typography><Typography>₹{summary.deliveryFees.toFixed(2)}</Typography></Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}><Typography>Tax</Typography><Typography>₹{summary.tax.toFixed(2)}</Typography></Box>
            {summary.discountAmount > 0 && (<Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}><Typography>Discount Amount</Typography><Typography>-₹{summary.discountAmount.toFixed(2)}</Typography></Box>)}
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}><Typography variant="h6">Total</Typography><Typography variant="h6">₹{summary.total.toFixed(2)}</Typography></Box>
          </Box>
          
          <Box sx={{ border: "1px solid #ccc", borderRadius: 2, p: 3 }}>
            <Typography variant="h6" gutterBottom>Select a payment method</Typography>
            <RadioGroup value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} sx={{ display: "flex", flexDirection: "column", gap: 2, py: 2 }}>
              {paymentOptions.map((option) => (
                <FormControlLabel
                  key={option.value} value={option.value} control={<Radio />} disabled={option.value === "upi"}
                  label={
                    <Card variant="outlined" sx={{ display: "flex", alignItems: "center", gap: 2, borderColor: paymentMethod === option.value ? "primary.main" : "grey.300", bgcolor: "transparent", p: 1 }}>
                      <CardActionArea onClick={() => setPaymentMethod(option.value)} disabled={option.value === "upi"} sx={{ display: "flex", alignItems: "center", gap: 2, bgcolor: "transparent" }}>
                        {option.img && (<Image src={option.img} alt={option.label} width={128} height={64} style={{ borderRadius: 6 }}/>)}
                        <CardContent sx={{ p: 0 }}>
                          <Typography variant="subtitle1">{option.label}</Typography>
                          <Typography variant="body2" color="textSecondary">{option.sub}</Typography>
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  }
                  sx={{ m: 0 }}
                />
              ))}
            </RadioGroup>
            <Button variant="contained" fullWidth onClick={placeOrder} disabled={addresses.length === 0 || loading}>
                {loading ? <CircularProgress size={24} color="inherit" /> : (paymentMethod === "cod" ? "Place Order" : "Proceed to Payment")}
            </Button>
          </Box>
        </Box>
      </Box>
    </>
  );
}