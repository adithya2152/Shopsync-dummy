"use client";

import { useState} from "react";
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
  IconButton,
  Tooltip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import DoneIcon from "@mui/icons-material/Done";


import { SelectChangeEvent } from "@mui/material/Select";


type DeliveryRecord = {
  orderId: string;
  customerId: string;
  deliveryAssistantId: string | null;
  shopId: number;
  estimatedDelivery: string; // timestamp
  actualDelivery: string | null; // timestamp
  status: string;
};

const mockDeliveries: DeliveryRecord[] = [
  {
    orderId: "ORD001",
    customerId: "CUST001",
    deliveryAssistantId: "DA001",
    shopId: 1,
    estimatedDelivery: "2025-05-12T17:00:00Z",
    actualDelivery: null,
    status: "Out for Delivery",
  },
  {
    orderId: "ORD002",
    customerId: "CUST002",
    deliveryAssistantId: "DA002",
    shopId: 2,
    estimatedDelivery: "2025-05-12T10:00:00Z",
    actualDelivery: "2025-05-12T13:30:00Z",
    status: "Completed",
  },
  {
    orderId: "ORD003",
    customerId: "CUST003",
    deliveryAssistantId: null,
    shopId: 1,
    estimatedDelivery: "2025-05-16T14:00:00Z",
    actualDelivery: null,
    status: "Pending",
  },
];

const DeliveryTrackingPage = () => {
  const [deliveries, setDeliveries] =
    useState<DeliveryRecord[]>(mockDeliveries);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  const handleStatusFilterChange = (
    e: SelectChangeEvent<string>
  ) => {
    setStatusFilter(e.target.value as string);
  };


  const exportCSV = () => {
    const csvContent = [
      [
        "OrderID",
        "CustomerID",
        "ShopID",
        "DeliveryAssistantID",
        "EstimatedDelivery",
        "ActualDelivery",
        "Status",
      ],
      ...deliveries.map((d) => [
        d.orderId,
        d.customerId,
        d.shopId,
        d.deliveryAssistantId ?? "Unassigned",
        d.estimatedDelivery,
        d.actualDelivery ?? "N/A",
        d.status,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "delivery_tracking.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const now = new Date();

  // const getTimestampCell = (estimated: string, actual: string | null) => {
  //   const est = new Date(estimated);
  //   const act = actual ? new Date(actual) : null;

  //   const isDelayed = !act && est < now;
  //   const wasLate = act && act > est;
    

  //   return (
  //     <Box>
  //       <Typography
  //         variant="body2"
  //         sx={{
  //           color: isDelayed || wasLate ? "orange" : "inherit",
  //           fontWeight: isDelayed ? 700 : "normal",
  //         }}
  //       >
  //         Estimated:{" "}
  //         <span style={{ color: isDelayed ? "red" : "inherit" }}>
  //           {est.toLocaleString()}
  //         </span>
  //       </Typography>

  //       {act && (
  //         <Typography
  //           variant="body2"
  //           sx={{
  //             color: wasLate ? "red" : "green",
  //             fontWeight: wasLate ? 700 : "normal",
  //           }}
  //         >
  //           Actual: {act.toLocaleString()}
  //         </Typography>
  //       )}
  //     </Box>
  //   );
  // };

  const filteredDeliveries = deliveries.filter((d) => {
    const matchesSearch =
      d.orderId.toLowerCase().includes(searchTerm) ||
      d.customerId.toLowerCase().includes(searchTerm);

    const matchesStatus = statusFilter === "All" || d.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleMarkAsDelivered = (orderId: string) => {
    const updated = deliveries.map((d) =>
      d.orderId === orderId
        ? {
            ...d,
            status: "Completed",
            actualDelivery: new Date().toISOString(),
          }
        : d
    );
    setDeliveries(updated);
  };

  return (
    <Container sx={{ padding: "20px", minHeight: "90vh" }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: "bold", mb: 2 }}>
        Delivery Tracking
      </Typography>

      <Box display="flex" justifyContent="space-between" mb={2} gap={2}>
        <TextField
          label="Search by Order ID / Customer ID"
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

      <TableContainer
        component={Paper}
        sx={{ borderRadius: 2, maxHeight: 500 }}
      >
        <Table stickyHeader>
          <TableHead sx={{ backgroundColor: "#5A9F6B" }}>
            <TableRow>
              <TableCell sx={{ color: "white", fontWeight: "bold", backgroundColor: "#5A9F6B" }}>CustomerID</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold", backgroundColor: "#5A9F6B" }}>OrderID</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold", backgroundColor: "#5A9F6B" }}>ShopID</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold", backgroundColor: "#5A9F6B" }}>DeliveryAssistantID</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold", backgroundColor: "#5A9F6B" }}>Estimated Delivery</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold", backgroundColor: "#5A9F6B" }}>Actual Delivery</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold", backgroundColor: "#5A9F6B" }}>Status</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold", backgroundColor: "#5A9F6B" }}>Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredDeliveries.map((d, index) => {
              const estimatedDate = new Date(d.estimatedDelivery);
              const actualDate = d.actualDelivery
                ? new Date(d.actualDelivery)
                : null;
              const isDelayed = !actualDate && estimatedDate < now;

              return (
                <TableRow
                  key={index}
                  sx={{
                    backgroundColor: isDelayed ? "#FFF3E0" : "inherit", // light orange background
                  }}
                >
                  <TableCell>{d.orderId}</TableCell>
                  <TableCell>{d.customerId}</TableCell>
                  <TableCell>{d.shopId}</TableCell>
                  <TableCell>{d.deliveryAssistantId ?? "Unassigned"}</TableCell>

                  {/* Estimated */}
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        color: isDelayed ? "red" : "inherit",
                        fontWeight: isDelayed ? "bold" : "normal",
                      }}
                    >
                      {estimatedDate.toLocaleString()}
                    </Typography>
                  </TableCell>

                  {/* Actual */}
                  <TableCell>
                    {actualDate ? (
                      <Typography variant="body2" sx={{ color: "green" }}>
                        {actualDate.toLocaleString()}
                      </Typography>
                    ) : (
                      <Typography
                        variant="body2"
                        sx={{ fontStyle: "italic", color: "gray" }}
                      >
                        Not Delivered
                      </Typography>
                    )}
                  </TableCell>

                  {/* Status */}
                  <TableCell>{d.status}</TableCell>

                  {/* Actions */}
                  <TableCell>
                    <Tooltip title="Mark as Delivered">
                      <span>
                        <IconButton
                          color="success"
                          onClick={() => handleMarkAsDelivered(d.orderId)}
                          disabled={d.status === "Completed"}
                        >
                          <DoneIcon />
                        </IconButton>
                      </span>
                    </Tooltip>

                    <Tooltip title="Reassign Assistant">
                      <IconButton color="secondary">
                        <AssignmentIndIcon />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Track">
                      <IconButton color="primary">
                        <LocalShippingIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default DeliveryTrackingPage;
