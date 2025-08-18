"use client";

import React, { useState, useEffect, ChangeEvent, useCallback } from "react";
import { FormControlLabel, Checkbox } from "@mui/material";

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
  IconButton,
  Grid,
  Divider
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import StarIcon from '@mui/icons-material/Star';
import axios from "axios";
import { toast } from "react-hot-toast";
import { useShopIdStore } from "@/store/ShopIdStore";

// Interfaces remain the same
interface OrderItem {
  productId: number;
  productName: string;
  quantity: number;
  price: string;
  rating: number | null;
}

interface Order {
  orderId: number;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shopID: number;
  shopName: string;
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
  d_rating: number | null;
  plt_fee: string;
  del_fee: string;
  tax: string;
  discount_amount : string;
  items: OrderItem[];
}

interface DeliveryAssistant {
  authid: string;
  username:string;
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

  // ✅ 1. State for the new confirmation dialog
  const [confirmPaidDialog, setConfirmPaidDialog] = useState<{
    open: boolean;
    orderId: number | null;
  }>({ open: false, orderId: null });

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
    if (!shopId) return;
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

  const fetchDeliveryAssistants = useCallback(async () => {
    try {
      const response = await axios.get("/api/manager/delivery-assistants");
      setDeliveryAssistants(response.data);
    } catch (error) {
      console.error("Error fetching delivery assistants:", error);
    }
  }, []);

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
    if(shopId) {
        fetchOrders();
        fetchDeliveryAssistants();
    }
  }, [shopId, fetchOrders, fetchDeliveryAssistants]);
  
  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter, filterOrders]);

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
      ["OrderID", "Customer", "Email", "Phone", "Status", "Total Amount", "Payment Status", "Delivery Assistant", "Created Date"],
      ...filteredOrders.map((order) => [
        order.orderId,
        order.customerName,
        order.customerEmail,
        order.customerPhone,
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
        <TextField label="Search Orders" variant="outlined" size="small" sx={{ width: "30%" }} onChange={handleSearchChange} InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1 }} /> }}/>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Status Filter</InputLabel>
          <Select value={statusFilter} label="Status Filter" onChange={handleStatusFilterChange}>
            <MenuItem value="All">All</MenuItem>
            <MenuItem value="Pending">Pending</MenuItem>
            <MenuItem value="Out for Delivery">Out for Delivery</MenuItem>
            <MenuItem value="Completed">Completed</MenuItem>
            <MenuItem value="Cancelled">Cancelled</MenuItem>
          </Select>
        </FormControl>
        <Button variant="contained" color="primary" startIcon={<FileDownloadIcon />} onClick={exportCSV}>
          Export
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold" }}>Order ID</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Customer</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Total Amount</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Payment</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Delivery Assistant</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Created Date</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredOrders.map((order) => {
              const itemsSubtotal = order.items.reduce((acc, item) => acc + parseFloat(item.price) * item.quantity, 0);
              return (
              <React.Fragment key={order.orderId}>
                <TableRow hover>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <IconButton size="small" onClick={() => toggleRowExpansion(order.orderId)}>
                        {expandedRows.has(order.orderId) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                      #{order.orderId}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">{order.customerName}</Typography>
                      <Typography variant="caption" color="textSecondary" component="div">{order.customerEmail}</Typography>
                      <Typography variant="caption" color="textSecondary">{order.customerPhone}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip label={order.status} color={getStatusColor(order.status)} size="small"/>
                  </TableCell>
                  <TableCell>₹{parseFloat(order.totalAmount).toFixed(2)}</TableCell>
                  <TableCell>
                    <Box display="flex" flexDirection="column" alignItems="flex-start" gap={0.5}>
                        <Chip label={order.paymentStatus} color={order.paymentStatus === "Completed" ? "success" : "warning"} size="small"/>
                        {order.paymentStatus !== "Completed" && (
                            // ✅ 2. Button now opens the dialog
                            <Button
                              variant="text"
                              size="small"
                              color="success"
                              onClick={() => setConfirmPaidDialog({ open: true, orderId: order.orderId })}
                              sx={{p: 0, textTransform: 'none'}}
                            >
                              Mark as Paid
                            </Button>
                        )}
                    </Box>
                  </TableCell>
                  <TableCell>{order.deliveryAssistantName || "Unassigned"}</TableCell>
                  <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button variant="outlined" size="small" onClick={() => setUpdateDialog({ open: true, order })}>
                      Update
                    </Button>
                  </TableCell>
                </TableRow>
                <TableRow key={`expanded-${order.orderId}`}>
                  <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
                    <Collapse in={expandedRows.has(order.orderId)} timeout="auto" unmountOnExit>
                      <Box sx={{ margin: 2, padding: 2, backgroundColor: '#fafafa', borderRadius: 2 }}>
                        <Grid container spacing={4}>
                          <Grid item xs={12} md={7}>
                            <Typography variant="h6" gutterBottom component="div">Order Items</Typography>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Product</TableCell>
                                  <TableCell align="center">Quantity</TableCell>
                                  <TableCell align="right">Price</TableCell>
                                  <TableCell align="center">Item Rating</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {order.items.map((item) => (
                                  <TableRow key={item.productId}>
                                    <TableCell>{item.productName}</TableCell>
                                    <TableCell align="center">{item.quantity}</TableCell>
                                    <TableCell align="right">₹{parseFloat(item.price).toFixed(2)}</TableCell>
                                    <TableCell align="center">
                                      {item.rating ? (
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                          {item.rating.toFixed(1)}
                                          <StarIcon sx={{ color: 'gold', fontSize: '1rem' }} />
                                        </Box>
                                      ) : (<Typography variant="caption" color="textSecondary">Not Rated</Typography>)}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </Grid>
                          <Grid item xs={12} md={5}>
                            <Typography variant="h6" gutterBottom component="div">Order Summary</Typography>
                            <Box sx={{display: 'flex', flexDirection: 'column', gap: 1}}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2" color="textSecondary">Items Subtotal</Typography><Typography variant="body2">₹{itemsSubtotal.toFixed(2)}</Typography></Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2" color="textSecondary">Discount</Typography><Typography variant="body2" color="error">- ₹{parseFloat(order.discount_amount || '0').toFixed(2)}</Typography></Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2" color="textSecondary">Delivery Fee</Typography><Typography variant="body2">₹{parseFloat(order.del_fee).toFixed(2)}</Typography></Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2" color="textSecondary">Tax & Platform Fee</Typography><Typography variant="body2">₹{(parseFloat(order.tax) + parseFloat(order.plt_fee)).toFixed(2)}</Typography></Box>
                              <Divider sx={{my: 1}}/>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="body1" fontWeight="bold">Grand Total</Typography><Typography variant="body1" fontWeight="bold">₹{parseFloat(order.totalAmount).toFixed(2)}</Typography></Box>
                              <Divider sx={{my: 1}}/>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                                <Typography variant="body2" color="textSecondary">Delivery Rating</Typography>
                                {order.d_rating ? (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Typography variant="body2" fontWeight="bold">{order.d_rating.toFixed(1)}</Typography>
                                    <StarIcon sx={{ color: 'gold', fontSize: '1.2rem' }} />
                                  </Box>
                                ) : (<Typography variant="caption" color="textSecondary">Not Rated Yet</Typography>)}
                              </Box>
                            </Box>
                          </Grid>
                        </Grid>
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            )})}
            {filteredOrders.length === 0 && (<TableRow><TableCell colSpan={8} align="center">No orders found.</TableCell></TableRow>)}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={updateDialog.open} onClose={() => setUpdateDialog({ open: false, order: null })} maxWidth="sm" fullWidth>
        <DialogTitle>Update Order #{updateDialog.order?.orderId}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={3} mt={1}>
            <FormControl fullWidth>
              <InputLabel id="status-select-label">Status</InputLabel>
              <Select labelId="status-select-label" value={updateForm.status} onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })} label="Status">
                <MenuItem value="Pending">Pending</MenuItem>
                <MenuItem value="Out for Delivery">Out for Delivery</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
                <MenuItem value="Cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel control={<Checkbox checked={updateForm.paymentStatus === "Completed"} onChange={(e) => setUpdateForm({ ...updateForm, paymentStatus: e.target.checked ? "Completed" : "Pending" })}/>} label="Mark Payment as Completed"/>
            <FormControl fullWidth>
              <InputLabel id="delivery-assistant-select-label">Delivery Assistant</InputLabel>
              <Select labelId="delivery-assistant-select-label" value={updateForm.deliveryAssistantId} onChange={(e) => setUpdateForm({ ...updateForm, deliveryAssistantId: e.target.value })} label="Delivery Assistant">
                <MenuItem value="">Unassigned</MenuItem>
                {deliveryAssistants.map((da) => (<MenuItem key={da.authid} value={da.authid}>{da.username} ({da.email})</MenuItem>))}
              </Select>
            </FormControl>
            <TextField label="Estimated Delivery" type="datetime-local" value={updateForm.estimatedDelivery} onChange={(e) => setUpdateForm({ ...updateForm, estimatedDelivery: e.target.value })} InputLabelProps={{ shrink: true }}/>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: '16px 24px' }}>
          <Button onClick={() => setUpdateDialog({ open: false, order: null })}>Cancel</Button>
          <Button variant="contained" onClick={() => {
                if (updateDialog.order) {
                    handleUpdateOrder(updateDialog.order.orderId, {
                        status: updateForm.status,
                        paymentStatus: updateForm.paymentStatus,
                        deliveryAssistantId: updateForm.deliveryAssistantId || null,
                        estimatedDelivery: updateForm.estimatedDelivery || null,
                    });
                }
            }}>Update</Button>
        </DialogActions>
      </Dialog>

      {/* ✅ 3. New Dialog component for payment confirmation */}
      <Dialog
        open={confirmPaidDialog.open}
        onClose={() => setConfirmPaidDialog({ open: false, orderId: null })}
        aria-labelledby="confirm-payment-dialog-title"
      >
        <DialogTitle id="confirm-payment-dialog-title">
          Confirm Payment Update
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to mark Order #{confirmPaidDialog.orderId} as paid? 
            This action can be changed later.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmPaidDialog({ open: false, orderId: null })}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (confirmPaidDialog.orderId) {
                handleMarkAsPaid(confirmPaidDialog.orderId);
              }
              setConfirmPaidDialog({ open: false, orderId: null });
            }}
            color="success"
            variant="contained"
            autoFocus
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

    </Container>
  );
};

export default OrdersPage;