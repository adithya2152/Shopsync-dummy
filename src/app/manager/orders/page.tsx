"use client";

import React, { useState, useEffect, ChangeEvent, useCallback } from "react";
import { FormControlLabel, Checkbox } from "@mui/material"; // Make sure this is imported at top

import {
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Button,
  Box,
  SelectChangeEvent,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Collapse,
  IconButton
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useShopIdStore } from "@/store/ShopIdStore";

interface OrderItem {
  productId: number;
  productName: string;
  quantity: number;
  price: string;
}

interface Order {
  orderId: number;
  customerId: string;
  customerName: string;
  customerEmail: string;
  shopID: number;
  deliveryAssistantId: string | null;
  deliveryAssistantName: string | null;
  status: string;
  totalAmount: string;
  paymentStatus: string;
  paymentMethod: string;
  estimatedDelivery: string | null;
  actualDelivery: string | null;
  createdAt: string;
  delLoc: unknown;
  items: OrderItem[];
}

interface DeliveryAssistant {
  authid: string;
  username: string;
  email: string;
  shopId: number;
}

const OrdersPage = () => {
    const { shopId } = useShopIdStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [deliveryAssistants, setDeliveryAssistants] = useState<DeliveryAssistant[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [loading, setLoading] = useState(true);
  const [updateDialog, setUpdateDialog] = useState<{
    open: boolean;
    order: Order | null;
  }>({ open: false, order: null });
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const [updateForm, setUpdateForm] = useState({
    status: "",
    paymentStatus: "",
    deliveryAssistantId: "",
    estimatedDelivery: "",
  });

  useEffect(() => {
    if (updateDialog.order) {
      setUpdateForm({
        status: updateDialog.order.status || "",
        paymentStatus: updateDialog.order.paymentStatus || "",
        deliveryAssistantId: updateDialog.order.deliveryAssistantId || "",
        estimatedDelivery: updateDialog.order.estimatedDelivery
          ? new Date(updateDialog.order.estimatedDelivery).toISOString().slice(0, 16)
          : "",
      });
    }
  }, [updateDialog.order]);


  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/get_orders_byShop?q=${shopId}`);
      setOrders(response.data);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  const filterOrders = useCallback(() => {
    const filtered = orders.filter((order) => {
      const matchesSearch =
        order.orderId.toString().includes(searchTerm) ||
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "All" || order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    setFilteredOrders(filtered);
  }, [orders, searchTerm, statusFilter]);

  useEffect(() => {
    fetchOrders();
    fetchDeliveryAssistants();
  }, [fetchOrders]);
  
  useEffect(() => {
    filterOrders();
  }, [filterOrders, orders, searchTerm, statusFilter]);

  const fetchDeliveryAssistants = async () => {
    try {
      const response = await axios.get("/api/manager/delivery-assistants");
      setDeliveryAssistants(response.data);
    } catch (error) {
      console.error("Error fetching delivery assistants:", error);
    }
  };

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilterChange = (e: SelectChangeEvent<string>) => {
    setStatusFilter(e.target.value as string);
  };

  const handleUpdateOrder = async (orderId: number, updates: Record<string, unknown>) => {
    try {
      await axios.put("/api/manager/orders", { orderId, ...updates });
      toast.success("Order updated successfully");
      fetchOrders();
      setUpdateDialog({ open: false, order: null });
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Failed to update order");
    }
  };

  const handleMarkAsPaid = async (orderId: number) => {
  try {
    await axios.put("/api/manager/orders/mark-paid", { orderId });
    toast.success(`Marked order #${orderId} as Paid`);
    fetchOrders();
  } catch (err) {
    console.error("Failed to mark as paid:", err);
    toast.error("Failed to mark payment as completed");
  }
};


  const exportCSV = () => {
    const csvContent = [
      [
        "OrderID",
        "Customer",
        "Email",
        "Status",
        "Total Amount",
        "Payment Status",
        "Delivery Assistant",
        "Created Date"
      ],
      ...filteredOrders.map((order) => [
        order.orderId,
        order.customerName,
        order.customerEmail,
        order.status,
        order.totalAmount,
        order.paymentStatus,
        order.deliveryAssistantName || "Unassigned",
        new Date(order.createdAt).toLocaleDateString()
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "orders.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleRowExpansion = (orderId: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedRows(newExpanded);
  };

  const getStatusColor = (status: string): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    switch (status) {
      case "Pending": return "warning";
      case "Out for Delivery": return "info";
      case "Completed": return "success";
      case "Cancelled": return "error";
      default: return "default";
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container sx={{ padding: "20px", minHeight: "90vh" }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: "bold", mb: 2 }}>
        Orders Management
      </Typography>

      <Box display="flex" justifyContent="space-between" mb={2} gap={2}>
        <TextField
          label="Search Orders"
          variant="outlined"
          size="small"
          sx={{ width: "30%" }}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1 }} />,
          }}
        />

        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Status Filter</InputLabel>
          <Select
            value={statusFilter}
            label="Status Filter"
            onChange={handleStatusFilterChange}
          >
            <MenuItem value="All">All</MenuItem>
            <MenuItem value="Pending">Pending</MenuItem>
            <MenuItem value="Out for Delivery">Out for Delivery</MenuItem>
            <MenuItem value="Completed">Completed</MenuItem>
            <MenuItem value="Cancelled">Cancelled</MenuItem>
          </Select>
        </FormControl>
        

        <Button
          variant="contained"
          color="primary"
          startIcon={<FileDownloadIcon />}
          onClick={exportCSV}
        >
          Export
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ backgroundColor: "#5A9F6B" }}>
            <TableRow>
              <TableCell sx={{ color: "white", fontWeight: "bold", backgroundColor: "#5A9F6B" }}>
                Order ID
              </TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold", backgroundColor: "#5A9F6B" }}>
                Customer
              </TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold", backgroundColor: "#5A9F6B" }}>
                Status
              </TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold", backgroundColor: "#5A9F6B" }}>
                Total Amount
              </TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold", backgroundColor: "#5A9F6B" }}>
                Payment
              </TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold", backgroundColor: "#5A9F6B" }}>
                Delivery Assistant
              </TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold", backgroundColor: "#5A9F6B" }}>
                Created Date
              </TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold", backgroundColor: "#5A9F6B" }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredOrders.map((order) => (
              <React.Fragment key={order.orderId}>
                <TableRow  hover>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <IconButton
                        size="small"
                        onClick={() => toggleRowExpansion(order.orderId)}
                      >
                        {expandedRows.has(order.orderId) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                      #{order.orderId}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {order.customerName}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {order.customerEmail}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={order.status}
                      color={getStatusColor(order.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>₹{parseFloat(order.totalAmount).toFixed(2)}</TableCell>
                  <TableCell>
  <Chip
    label={order.paymentStatus}
    color={order.paymentStatus === "Completed" ? "success" : "warning"}
    size="small"
  />
  {order.paymentStatus !== "Completed" && (
    <Button
      variant="text"
      size="small"
      color="success"
      sx={{ ml: 1 }}
      onClick={() => handleMarkAsPaid(order.orderId)}
    >
      Mark as Paid
    </Button>
  )}
</TableCell>

                  <TableCell>
                    {order.deliveryAssistantName || "Unassigned"}
                  </TableCell>
                  <TableCell>
                    {new Date(order.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setUpdateDialog({ open: true, order })}
                    >
                      Update
                    </Button>
                  </TableCell>
                </TableRow>
                <TableRow key={`expanded-${order.orderId}`}>
                  <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
                    <Collapse in={expandedRows.has(order.orderId)} timeout="auto" unmountOnExit>
                      <Box margin={1}>
                        <Typography variant="h6" gutterBottom component="div">
                          Order Items
                        </Typography>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Product</TableCell>
                              <TableCell align="right">Quantity</TableCell>
                              <TableCell align="right">Price</TableCell>
                              <TableCell align="right">Subtotal</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {order.items.map((item) => (
                              <TableRow key={item.productId}>
                                <TableCell>{item.productName}</TableCell>
                                <TableCell align="right">{item.quantity}</TableCell>
                                <TableCell align="right">₹{parseFloat(item.price).toFixed(2)}</TableCell>
                                <TableCell align="right">
                                  ₹{(parseFloat(item.price) * item.quantity).toFixed(2)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
            {filteredOrders.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No orders found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Update Order Dialog */}
      <Dialog
        open={updateDialog.open}
        onClose={() => setUpdateDialog({ open: false, order: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Update Order #{updateDialog.order?.orderId}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <FormControl fullWidth>
  <InputLabel>Status</InputLabel>
  <Select
    value={updateForm.status}
    onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })}
    label="Status"
    id="status-select"
  >
    <MenuItem value="Pending">Pending</MenuItem>
    <MenuItem value="Out for Delivery">Out for Delivery</MenuItem>
    <MenuItem value="Completed">Completed</MenuItem>
    <MenuItem value="Cancelled">Cancelled</MenuItem>
  </Select>
</FormControl>


<FormControlLabel
  control={
    <Checkbox
      checked={updateForm.paymentStatus === "Completed"}
      onChange={(e) =>
        setUpdateForm({ ...updateForm, paymentStatus: e.target.checked ? "Completed" : "Pending" })
      }
    />
  }
  label="Mark Payment as Completed"
/>


<FormControl fullWidth>
  <InputLabel>Delivery Assistant</InputLabel>
  <Select
    value={updateForm.deliveryAssistantId}
    onChange={(e) => setUpdateForm({ ...updateForm, deliveryAssistantId: e.target.value })}
    label="Delivery Assistant"
    id="delivery-assistant-select"
  >
    <MenuItem value="">Unassigned</MenuItem>
    {deliveryAssistants.map((da) => (
      <MenuItem key={da.authid} value={da.authid}>
        {da.username} ({da.email})
      </MenuItem>
    ))}
  </Select>
</FormControl>

<TextField
  label="Estimated Delivery"
  type="datetime-local"
  value={updateForm.estimatedDelivery}
  onChange={(e) => setUpdateForm({ ...updateForm, estimatedDelivery: e.target.value })}
  InputLabelProps={{ shrink: true }}
  id="estimated-delivery"
/>

          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUpdateDialog({ open: false, order: null })}>
            Cancel
          </Button>
          <Button
  variant="contained"
  onClick={() => {
    handleUpdateOrder(updateDialog.order!.orderId, {
      status: updateForm.status,
      paymentStatus: updateForm.paymentStatus,
      deliveryAssistantId: updateForm.deliveryAssistantId || null,
      estimatedDelivery: updateForm.estimatedDelivery || null,
    });
  }}
>
  Update
</Button>


        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default OrdersPage;