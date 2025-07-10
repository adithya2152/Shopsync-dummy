"use client";

import {
  Box,
  Typography,
  Divider,
  Card,
  CardContent,
  Chip,
  CircularProgress,
} from "@mui/material";
import { useState, useEffect } from "react";
import axios from "axios";
import Nav from "@/components/Nav";
import { useAuth } from "@/components/AuthProvider";

// Types
type OrderItem = {
  id: number;
  name: string;
  price: string;
  imgPath?: string;
  quantity: number;
};

type Order = {
  id: number;
  status: string;
  createdAt: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  shop: {
    id: number;
    name: string;
  };
  items: OrderItem[];
};

export default function OrdersPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        if (isAuthenticated && user) {
          const ordersRes = await axios.get("/api/get_orders");
          setOrders(ordersRes.data);
        }
      } catch (err) {
        console.error("Auth verification failed:", err);
      } finally {
        setLoading(false);
      }
    };

    verifyAuth();
  }, [isAuthenticated, user]);

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
      <Box sx={{ py: 4, px: 2 }}>
        <Typography variant="h4" gutterBottom>
          Your Orders
        </Typography>
        <Divider sx={{ mb: 4 }} />

        {orders.length === 0 ? (
          <Typography>No past orders yet.</Typography>
        ) : (
          orders.map((order) => <OrderCard key={order.id} order={order} />)
        )}
      </Box>
    </>
  );
}

function OrderCard({ order }: { order: Order }) {
    const {
      id,
      status,
      createdAt,
      estimatedDelivery,
      actualDelivery,
      shop,
      items,
    } = order;
  
    const total = items.reduce(
      (sum, item) => sum + parseFloat(item.price) * item.quantity,
      0
    );
  
    return (
      <Card raised={true} sx={{ mb: 4, p: 2, backgroundColor: "rgba(255, 255, 255, 0.3)" }}>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              flexWrap: "wrap",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="h6">Order #{id}</Typography>
            <Chip
              label={status}
              color={
                status === "Delivered"
                  ? "success"
                  : status === "Cancelled"
                  ? "error"
                  : "warning"
              }
            />
          </Box>
  
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Shop: {shop?.name}
          </Typography>
  
          <Typography variant="body2" color="text.secondary">
            Placed on: {new Date(createdAt).toLocaleString("en-GB", { hour12: true }).toUpperCase()}
          </Typography>
          {actualDelivery && (
            <Typography variant="body2" color="text.secondary">
              Delivered: {new Date(actualDelivery).toLocaleString("en-GB", { hour12: true }).toUpperCase()}
            </Typography>
          )}
          {estimatedDelivery && !actualDelivery && (
            <Typography variant="body2" color="text.secondary">
              ETA: {new Date(estimatedDelivery).toLocaleString("en-GB", { hour12: true }).toUpperCase()}
            </Typography>
          )}
  
          <Divider sx={{ my: 2 }} />
  
          {/* Product Table */}
          <Box sx={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th align="left" style={{ padding: "8px" }}>Product</th>
                  <th align="center" style={{ padding: "8px" }}>Qty</th>
                  <th align="right" style={{ padding: "8px" }}>Price</th>
                  <th align="right" style={{ padding: "8px" }}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td style={{ padding: "8px" }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        {item.name}
                      </Box>
                    </td>
                    <td align="center" style={{ padding: "8px" }}>
                      {item.quantity}
                    </td>
                    <td align="right" style={{ padding: "8px" }}>
                      ₹{parseFloat(item.price).toFixed(2)}
                    </td>
                    <td align="right" style={{ padding: "8px" }}>
                      ₹{(parseFloat(item.price) * item.quantity).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
  
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" align="right">
            Total: ₹{total.toFixed(2)}
          </Typography>
        </CardContent>
      </Card>
    );
  }