"use client";

import {
  Box,
  Typography,
  Divider,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Rating,
} from "@mui/material";
import { useState, useEffect } from "react";
import axios from "axios";
import Nav from "@/components/Nav";

// Types
type OrderItem = {
  id: number;
  name: string;
  price: string;
  quantity: number;
  rating?: number | null;
};

type Order = {
  id: number;
  status: string;
  createdAt: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  d_rating?: number | null;
  shop: {
    id: number;
    name: string;
  };
  plt_fee: string | null;
  del_fee: string | null;
  tax: string | null;
  discount_amount: string | null;
  items: OrderItem[];
};

export default function OrdersPage() {
  const [navType, setNavType] = useState<"landing" | "customer">("landing");
  const [loading, setLoading] = useState(true);
  const [, setAuthid] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const cookieRes = await fetch("/api/get_user");
        if (cookieRes.ok) {
          const { id } = await cookieRes.json();
          const authRes = await fetch("/api/auth/is_auth");

          if (authRes.ok) {
            const authData = await authRes.json();
            if (authData.authenticated) {
              setNavType("customer");
              setAuthid(id);
            }
          }

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
  }, []);

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

  return (
    <>
      <Nav navType={navType} />
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
    d_rating,
    shop,
    items,
    plt_fee,
    del_fee,
    tax,
    discount_amount
  } = order;

  const [ratings, setRatings] = useState<{ [itemId: number]: number | null }>(() => {
    const initial: { [itemId: number]: number | null } = {};
    items.forEach((item) => {
      initial[item.id] = item.rating ?? null;
    });
    return initial;
  });

  const [deliveryRating, setDeliveryRating] = useState<number | null>(
    d_rating ?? null
  );

  const handleProductRatingChange = async (
    itemId: number,
    newValue: number | null
  ) => {
    setRatings((prev) => ({ ...prev, [itemId]: newValue }));

    try {
      await axios.post("/api/add_rating", {
        order_id: id,
        item_id: itemId,
        rating: newValue,
      });
    } catch (error) {
      console.error("Failed to submit product rating", error);
    }
  };

  const handleDeliveryRatingChange = async (newValue: number | null) => {
    setDeliveryRating(newValue);

    try {
      await axios.post("/api/add_rating", {
        order_id: id,
        rating: newValue,
      });
    } catch (error) {
      console.error("Failed to submit delivery rating", error);
    }
  };

  const subtotal = items.reduce(
    (sum, item) => sum + parseFloat(item.price) * item.quantity,
    0
  );

  const total = subtotal + (parseFloat(plt_fee || "0")) + (parseFloat(del_fee || "0")) + (parseFloat(tax || "0")) - (parseFloat(discount_amount || "0" ));

  return (
    <Card
      raised
      sx={{ mb: 4, p: 2, backgroundColor: "rgba(255, 255, 255, 0.3)" }}
    >
      <CardContent>
        {/* Header */}
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
              status === "Completed"
                ? "success"
                : status === "Cancelled"
                ? "error"
                : status === "Pending"
                ? "warning"
                : "info"
            }
          />
        </Box>

        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Shop: {shop?.name}
        </Typography>

        <Typography variant="body2" color="text.secondary">
          Placed on:{" "}
          {new Date(createdAt)
            .toLocaleString("en-GB", { hour12: true })
            .toUpperCase()}
        </Typography>

        {actualDelivery && (
          <Typography variant="body2" color="text.secondary">
            Delivered:{" "}
            {new Date(actualDelivery)
              .toLocaleString("en-GB", { hour12: true })
              .toUpperCase()}
          </Typography>
        )}

        {estimatedDelivery && !actualDelivery && (
          <Typography variant="body2" color="text.secondary">
            ETA:{" "}
            {new Date(estimatedDelivery)
              .toLocaleString("en-GB", { hour12: true })
              .toUpperCase()}
          </Typography>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Product Table */}
        <Box sx={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th align="left" style={{ padding: "8px" }}>
                  Product
                </th>
                <th align="center" style={{ padding: "8px" }}>
                  Qty
                </th>
                <th align="right" style={{ padding: "8px" }}>
                  Price
                </th>
                <th align="right" style={{ padding: "8px" }}>
                  Subtotal
                </th>
                {status === "Delivered" && (
                  <th align="center" style={{ padding: "8px" }}>
                    Add a rating
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td style={{ padding: "8px" }}>{item.name}</td>
                  <td align="center" style={{ padding: "8px" }}>
                    {item.quantity}
                  </td>
                  <td align="right" style={{ padding: "8px" }}>
                    ₹{parseFloat(item.price).toFixed(2)}
                  </td>
                  <td align="right" style={{ padding: "8px" }}>
                    ₹{(parseFloat(item.price) * item.quantity).toFixed(2)}
                  </td>
                  {status === "Completed" && (
                    <td align="center" style={{ padding: "8px" }}>
                      <Rating
                        name={`rating-${item.id}`}
                        value={ratings[item.id] ?? null}
                        onChange={(_, newValue) =>
                          handleProductRatingChange(item.id, newValue)
                        }
                      />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </Box>

        <Divider sx={{ my: 2 }} />
        <Typography variant="h6" align="right">
         Items Total: ₹{subtotal.toFixed(2)} 
        </Typography>
        <Typography variant="h6" align="right">
          Platform Fees: ₹{parseFloat(plt_fee || "0").toFixed(2)} 
        </Typography>
        <Typography variant="h6" align="right">
          Delivery Fees: ₹{parseFloat(del_fee || "0").toFixed(2)} 
        </Typography>
        <Typography variant="h6" align="right">
          Tax: ₹{parseFloat(tax || "0").toFixed(2)} 
        </Typography>
        {discount_amount && parseFloat(discount_amount) > 0 && (
          <Typography variant="h6" align="right">
            Discount: -₹{parseFloat(discount_amount || "0").toFixed(2)} 
          </Typography>
        )}
        <Typography variant="h6" align="right">
          Total: ₹{total.toFixed(2)}
        </Typography>

        {/* Delivery Rating */}
        {status === "Completed" && (
          <>
            <Divider sx={{ my: 3 }} />
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                flexWrap: "wrap",
              }}
            >
              <Typography variant="subtitle1">Rate the delivery:</Typography>
              <Rating
                name={`delivery-rating-${id}`}
                size="large"
                value={deliveryRating}
                onChange={(_, newValue) =>
                  handleDeliveryRatingChange(newValue)
                }
              />
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
}
