"use client";

import { useState, useEffect } from "react";
import Image from 'next/image'
import axios from "axios";
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
  CardContent
} from "@mui/material";
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Nav from "@/components/Nav";
import RemoveIcon from "@mui/icons-material/Remove";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { toast } from "react-hot-toast";

interface EnrichedCartItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
}

export default function CheckoutPage() {
  const [cart, setCart] = useState<EnrichedCartItem[]>([]);
  const [subtotal, setSubtotal] = useState<number>(0);
  const [platformFees, setPlatformFees] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [navType, setNavType] = useState<"landing" | "customer">("landing");
  const [shopId, setShopId] = useState<number | null>(null);

  const [houseNumber, setHouseNumber] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [pinCode, setPinCode] = useState("");

  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [orderId, setOrderId] = useState<number | null>(null);


  const paymentOptions = [
    {
      value: "upi",
      label: "Any UPI App",
      sub: "Google Pay, PhonePe, Paytm, etc.",
      img: "/images/upi.png",
    },
    {
      value: "cod",
      label: "Cash/Pay on Delivery",
      sub: "Pay cash or UPI when your order arrives",
    },
  ];

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const authRes = await axios.get("/api/auth/is_auth");
        if (authRes.data.authenticated) {
          setNavType("customer");

          const userSettings = await axios.get("/api/user_settings");

          const addr = userSettings.data.homeLoc || {};
          setHouseNumber(addr.house_number || "");
          setStreetAddress(addr.street_address || "");
          setAddressLine2(addr.address_line2 || "");
          setCity(addr.city || "");
          setPinCode(addr.pin_code || "");
        }

        const storedCart = localStorage.getItem("cart");
        const storedShopId = localStorage.getItem("currentShopId");
        if (!storedCart || !storedShopId) return;

        const response = await axios.post("/api/checkout/summary", {
          cart: JSON.parse(storedCart),
          shopId: parseInt(storedShopId, 10),
        });

        const data = response.data;
        setCart(data.cart || []);
        setSubtotal(typeof data.subtotal === "number" ? data.subtotal : 0);
        setPlatformFees(typeof data.platformFees === "number" ? data.platformFees : 0);
        setTotal(typeof data.total === "number" ? data.total : 0);
        setShopId(parseInt(storedShopId, 10));
      } catch (err) {
        console.error("Error during checkout init:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    const refreshCart = async () => {
      localStorage.setItem("cart", JSON.stringify(cart));
      const storedShopId = localStorage.getItem("currentShopId");
      try {
        const response = await axios.post("/api/checkout/summary", {
          cart,
          shopId: storedShopId ? parseInt(storedShopId, 10) : null,
        });

        const data = response.data;
        setSubtotal(typeof data.subtotal === "number" ? data.subtotal : 0);
        setPlatformFees(typeof data.platformFees === "number" ? data.platformFees : 0);
        setTotal(typeof data.total === "number" ? data.total : 0);
      } catch (err) {
        console.error("Error refreshing cart:", err);
      }
    };

    if (cart.length > 0) refreshCart();
  }, [cart]);

  const addToCart = (productId: number) => {
    setCart(prev =>
      prev.map(item =>
        item.id === productId ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const removeFromCart = (productId: number) => {
    setCart(prev =>
      prev
        .map(item =>
          item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter(item => item.quantity > 0)
    );
  };

  const [couponCode, setCouponCode] = useState("");
  const handleApplyCoupon = () => {
    console.log("Apply coupon:", couponCode);
    // TODO: Add backend coupon verification logic
  };


  const placeOrder = async () => {
    if (paymentMethod !== "cod") {
      toast.error("Payment method not supported yet. Please select Cash on Delivery.");
      return;
    }
    const resp = await axios.post(
      "/api/place_order", {
        cart: cart,
        shopId: shopId,
        address: {
          house_number: houseNumber,
          street_address: streetAddress,
          address_line2: addressLine2,
          city: city,
          pin_code: pinCode,
          latitude: null,
          longitude: null
        },
        paymentMethod
      }
    )

    if (resp.status === 201) {
      const orderId = resp.data.orderId;
      setCart([]);
      localStorage.removeItem("cart");
      toast.success(`Order placed successfully! Your order ID is ${orderId}.`);
      setOrderId(orderId);
    }
    else {
      toast.error("Failed to place order. Please try again.");
    }
  }

  if (loading) {
    return (
      <>
        <Nav navType={navType} />
        <Box textAlign="center" mt={6}>
          <CircularProgress />
        </Box>
      </>
    );
  }

  if (orderId) {
    return (
      <>
        <Nav navType={navType} />
        <Box textAlign="center" mt={4}>
          <Typography variant="h3">
            Thank You for Your Order!
          </Typography>
          <Typography variant="h6">
            Your order has been placed successfully! Your order ID is {orderId}.
          </Typography>
          <Button variant="contained" href="/" sx={{ mt: 2 }}>
            Continue Shopping
          </Button>
          <Button variant="outlined" href="/history" sx={{ mt: 2, ml: 2 }}>
            View Orders
          </Button>
        </Box>
      </>
    )
  }

  if (cart.length === 0) {
    return (
      <>
        <Nav navType={navType} />
        <Box textAlign="center" mt={4}>
          <Typography variant="h6">
            Your cart is empty. Please add items to your cart before checking out.
          </Typography>
          <Button variant="contained" href="/" sx={{ mt: 2 }}>
            Shop Now
          </Button>
        </Box>
      </>
    );
  }

  return (
    <>
      <Nav navType={navType} />
      <Typography variant="h4" align="center" gutterBottom>
        Checkout Order
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 4, p: 4 }}>
        {/* Left Panel */}
        <Box sx={{ flex: 3, minWidth: 300 }}>
          <Typography variant="h5" gutterBottom>
            Items in your cart:
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {cart.map(item => (
            <Paper
              key={item.id}
              sx={{
                mb: 2,
                p: 2,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
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
                  <IconButton onClick={() => addToCart(item.id)} size="small">
                    <AddIcon />
                  </IconButton>
                </Box>
              </Box>
              <Typography variant="subtitle1">
                ₹{(item.quantity * item.price).toFixed(2)}
              </Typography>
            </Paper>
          ))}

          <Divider sx={{ mt: 4, mb: 2 }} />
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="h6">Subtotal:</Typography>
            <Typography variant="h6">₹{subtotal.toFixed(2)}</Typography>
          </Box>

          <Divider sx={{ mt: 4, mb: 2 }} />
          <Box sx={{ border: "1px solid #ccc", borderRadius: 2, p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Delivery Address
            </Typography>

            <TextField
              fullWidth
              label="House Number"
              value={houseNumber}
              onChange={(e) => setHouseNumber(e.target.value)}
              error={!houseNumber.trim()}
              helperText={!houseNumber.trim() && "Required"}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Street Address"
              value={streetAddress}
              onChange={(e) => setStreetAddress(e.target.value)}
              error={!streetAddress.trim()}
              helperText={!streetAddress.trim() && "Required"}
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
              helperText={!city.trim() && "Required"}
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
          </Box>
        </Box>

        {/* Right Panel */}
        <Box sx={{ flex: 1, minWidth: 500, display: "flex", flexDirection: "column", gap: 3 }}>
          <Box sx={{ border: "1px solid #ccc", borderRadius: 2, p: 3 }}>
            <Typography variant="h6" gutterBottom>Have a coupon code?</Typography>
            <TextField
              size="small"
              fullWidth
              placeholder="Enter code"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Button
              variant="contained"
              fullWidth
              onClick={handleApplyCoupon}
              disabled={!couponCode.trim()}
            >
              Apply Code
            </Button>
          </Box>

          <Box sx={{ border: "1px solid #ccc", borderRadius: 2, p: 3 }}>
            <Typography variant="h6" gutterBottom>Summary</Typography>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
              <Typography>Items Subtotal</Typography>
              <Typography>₹{subtotal.toFixed(2)}</Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
              <Typography>Platform Fees</Typography>
              <Typography>₹{platformFees.toFixed(2)}</Typography>
            </Box>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
              <Typography variant="h6">Total</Typography>
              <Typography variant="h6">₹{total.toFixed(2)}</Typography>
            </Box>
          </Box>
          <Box sx={{ border: "1px solid #ccc", borderRadius: 2, p: 3 }}>
            <Typography variant="h6" gutterBottom>Select a payment method</Typography>
            <RadioGroup
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              sx={{ display: "flex", flexDirection: "column", gap: 2, py: 2 }}
            >
              {paymentOptions.map((option) => (
                <FormControlLabel
                  key={option.value}
                  value={option.value}
                  control={<Radio />}
                  disabled={option.value === "upi"}
                  label={
                    <Card
                      variant="outlined"
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        borderColor: paymentMethod === option.value ? "primary.main" : "grey.300",
                        bgcolor: "transparent",
                        p: 1,
                      }}
                    >
                      <CardActionArea onClick={() => setPaymentMethod(option.value)} disabled={option.value === "upi"} sx={{ display: "flex", alignItems: "center", gap: 2, bgcolor: "transparent" }} >

                        {option.img && (
                          <Image
                            src={option.img}
                            alt={option.label}
                            width={128}
                            height={64}
                            style={{ borderRadius: 6 }}
                          />
                        )}
                        <CardContent sx={{ p: 0 }}>
                          <Typography variant="subtitle1">{option.label}</Typography>
                          <Typography variant="body2" color="textSecondary">{option.sub}</Typography>
                        </CardContent>

                      </CardActionArea>
                    </Card>
                  }
                  sx={{
                    m: 0,
                  }}
                />
              ))}
            </RadioGroup>
            <Button
              variant="contained"
              fullWidth
              onClick={placeOrder}
            >
              {paymentMethod === "cod" ? "Place Order" : "Proceed to Payment"}
            </Button>
          </Box>
        </Box>
      </Box>
    </>
  );
}
