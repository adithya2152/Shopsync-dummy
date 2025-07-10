"use client";

import {
  Container,
  Typography,
  TextField,
  Box,
  Button,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
} from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { useState, ChangeEvent } from "react";

// ✅ Dummy Data
const dummyEmployees = [
  { id: 1, username: "john_manager", email: "john@example.com", role: "Manager" },
  { id: 2, username: "sarah_head", email: "sarah@example.com", role: "ProductHead" },
  { id: 3, username: "dev_assist_01", email: "delivery@example.com", role: "DeliveryAssistant" },
];

const EmployeeManagementPage = () => {
  const [employees] = useState(dummyEmployees);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  const handleRoleFilterChange = (e: SelectChangeEvent<string>) => {
    setRoleFilter(e.target.value as string);
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.username.toLowerCase().includes(searchTerm) || emp.email.toLowerCase().includes(searchTerm);

    const matchesRole = roleFilter === "All" || emp.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const exportCSV = () => {
    const csvContent = [
      ["Username", "Email", "Role"],
      ...filteredEmployees.map((emp) => [emp.username, emp.email, emp.role]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "employees.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Container sx={{ padding: "20px", minHeight: "90vh" }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: "bold", marginBottom: "20px" }}>
        Employee Management
      </Typography>

      <Box display="flex" justifyContent="space-between" mb={2} gap={2}>
        <TextField
          label="Search Employee"
          variant="outlined"
          size="small"
          sx={{ width: "30%" }}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1 }} />,
          }}
        />

        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Role Filter</InputLabel>
          <Select value={roleFilter} label="Role Filter" onChange={handleRoleFilterChange}>
            <MenuItem value="All">All</MenuItem>
            <MenuItem value="Manager">Manager</MenuItem>
            <MenuItem value="ProductHead">ProductHead</MenuItem>
            <MenuItem value="DeliveryAssistant">DeliveryAssistant</MenuItem>
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

      <TableContainer component={Paper} sx={{ borderRadius: 2, maxHeight: 500 }}>
        <Table stickyHeader>
          <TableHead sx={{ backgroundColor: "#5A9F6B" }}>
            <TableRow>
              {["Username", "Email", "Role", "Actions"].map((head, idx) => (
                <TableCell key={idx}  sx={{ color: "white", fontWeight: "bold", backgroundColor: "#5A9F6B" }}>
                  {head}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredEmployees.map((emp) => (
              <TableRow key={emp.id} hover>
                <TableCell>{emp.username}</TableCell>
                <TableCell>{emp.email}</TableCell>
                <TableCell>{emp.role}</TableCell>
                <TableCell>
                  <Tooltip title="Edit">
                    <IconButton color="primary" size="small">
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton color="error" size="small">
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}

            {filteredEmployees.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No employees match the criteria.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default EmployeeManagementPage;
