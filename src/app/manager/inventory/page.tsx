"use client";

import React, { useState, useEffect, ChangeEvent } from "react";
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  IconButton,
  Tooltip,
  SelectChangeEvent,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PercentIcon from "@mui/icons-material/Percent";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useShopIdStore } from "@/store/ShopIdStore";

interface Product {
  id: number;
  name: string;
  description: string;
  price: string;
  stock: number;
  mnf_date: string | null;
  exp_date: string | null;
  categoryId: number;
  shopId: number;
  imgPath: string | null;
  discount: string | null;
  createdAt: string;
}

interface Category {
  id: number;
  name: string;
}

const InventoryPage = () => {
  const { shopId } = useShopIdStore();
  const [inventory, setInventory] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [addDialog, setAddDialog] = useState(false);
  const [editDialog, setEditDialog] = useState<{ open: boolean; product: Product | null }>({
    open: false,
    product: null,
  });
  const [discountDialog, setDiscountDialog] = useState<{ open: boolean; product: Product | null }>({
    open: false,
    product: null,
  });

  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    mnf_date: "",
    exp_date: "",
    categoryId: "",
    image: null as File | null,
  });

  const [editProduct, setEditProduct] = useState({
    id: 0,
    name: "",
    description: "",
    price: "",
    stock: "",
    mnf_date: "",
    exp_date: "",
    categoryId: "",
    image: null as File | null,
  });

  const [discountValue, setDiscountValue] = useState("");

  useEffect(() => {
    if (shopId) {
      fetchInventory();
      fetchCategories();
    }
  }, [shopId]);

  useEffect(() => {
    filterInventory();
  }, [inventory, searchTerm, categoryFilter]);

  const fetchInventory = async () => {
    if (!shopId) return;
    try {
      setLoading(true);
      const response = await axios.get(`/api/manager/getinventory?shopId=${shopId}`);
      setInventory(response.data);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      toast.error("Failed to fetch inventory");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get("/api/get_categories");
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const filterInventory = () => {
    const filtered = inventory.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === "All" || item.categoryId.toString() === categoryFilter;
      return matchesSearch && matchesCategory;
    });
    setFilteredInventory(filtered);
  };

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleCategoryFilterChange = (e: SelectChangeEvent<string>) => {
    setCategoryFilter(e.target.value as string);
  };

  const handleAddProduct = async () => {
    if (!shopId) return;
    try {
      const formData = new FormData();
      formData.append("product", JSON.stringify(newProduct));
      formData.append("shopId", shopId.toString());
      if (newProduct.image) {
        formData.append("image", newProduct.image);
      }

      await axios.post("/api/manager/addinventory", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Product added successfully");
      setAddDialog(false);
      setNewProduct({
        name: "",
        description: "",
        price: "",
        stock: "",
        mnf_date: "",
        exp_date: "",
        categoryId: "",
        image: null,
      });
      fetchInventory();
    } catch (error) {
      console.error("Error adding product:", error);
      toast.error("Failed to add product");
    }
  };

  const handleEditProduct = async () => {
    if (!shopId) return;
    try {
      const formData = new FormData();
      formData.append("product", JSON.stringify(editProduct));
      formData.append("shopId", shopId.toString());
      if (editProduct.image) {
        formData.append("image", editProduct.image);
      }

      await axios.put("/api/manager/updateinventory", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Product updated successfully");
      setEditDialog({ open: false, product: null });
      fetchInventory();
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Failed to update product");
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    if (!shopId) return;
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        await axios.delete(`/api/manager/deleteinventory?productId=${productId}&shopId=${shopId}`);
        toast.success("Product deleted successfully");
        fetchInventory();
      } catch (error) {
        console.error("Error deleting product:", error);
        toast.error("Failed to delete product");
      }
    }
  };

  const handleUpdateDiscount = async () => {
    if (!shopId || !discountDialog.product) return;
    try {
      const discount = discountValue === "" ? null : parseFloat(discountValue);
      await axios.put(`/api/manager/updatediscount?shopId=${shopId}`, {
        productId: discountDialog.product.id,
        discount,
      });

      toast.success("Discount updated successfully");
      setDiscountDialog({ open: false, product: null });
      setDiscountValue("");
      fetchInventory();
    } catch (error) {
      console.error("Error updating discount:", error);
      toast.error("Failed to update discount");
    }
  };

  const exportCSV = () => {
    const csvContent = [
      ["Name", "Description", "Price", "Stock", "Category", "Discount", "Created Date"],
      ...filteredInventory.map((item) => [
        item.name,
        item.description,
        item.price,
        item.stock,
        categories.find(c => c.id === item.categoryId)?.name || "Unknown",
        item.discount || "0",
        new Date(item.createdAt).toLocaleDateString(),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "inventory.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openEditDialog = (product: Product) => {
    setEditProduct({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock.toString(),
      mnf_date: product.mnf_date || "",
      exp_date: product.exp_date || "",
      categoryId: product.categoryId.toString(),
      image: null,
    });
    setEditDialog({ open: true, product });
  };

  const openDiscountDialog = (product: Product) => {
    setDiscountValue(product.discount || "");
    setDiscountDialog({ open: true, product });
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
        Inventory Management
      </Typography>

      <Box display="flex" justifyContent="space-between" mb={2} gap={2}>
        <TextField
          label="Search Products"
          variant="outlined"
          size="small"
          sx={{ width: "30%" }}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1 }} />,
          }}
        />

        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Category Filter</InputLabel>
          <Select value={categoryFilter} label="Category Filter" onChange={handleCategoryFilterChange}>
            <MenuItem value="All">All Categories</MenuItem>
            {categories.map((category) => (
              <MenuItem key={category.id} value={category.id.toString()}>
                {category.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setAddDialog(true)}
        >
          Add Product
        </Button>

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
          <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold" }}>Name</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Description</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Price</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Stock</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Category</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Discount</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredInventory.map((item) => (
              <TableRow key={item.id} hover>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.description}</TableCell>
                <TableCell>₹{parseFloat(item.price).toFixed(2)}</TableCell>
                <TableCell>{item.stock}</TableCell>
                <TableCell>
                  {categories.find(c => c.id === item.categoryId)?.name || "Unknown"}
                </TableCell>
                <TableCell>
                  {item.discount ? `${item.discount}%` : "No discount"}
                </TableCell>
                <TableCell>
                  <Tooltip title="Edit Product">
                    <IconButton color="primary" size="small" onClick={() => openEditDialog(item)}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Update Discount">
                    <IconButton color="secondary" size="small" onClick={() => openDiscountDialog(item)}>
                      <PercentIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete Product">
                    <IconButton color="error" size="small" onClick={() => handleDeleteProduct(item.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {filteredInventory.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No products found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Product Dialog */}
      <Dialog open={addDialog} onClose={() => setAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Product</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Product Name"
              value={newProduct.name}
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              fullWidth
            />
            <TextField
              label="Description"
              value={newProduct.description}
              onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />
            <TextField
              label="Price"
              type="number"
              value={newProduct.price}
              onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
              fullWidth
            />
            <TextField
              label="Stock"
              type="number"
              value={newProduct.stock}
              onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={newProduct.categoryId}
                onChange={(e) => setNewProduct({ ...newProduct, categoryId: e.target.value })}
              >
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Manufacturing Date"
              type="date"
              value={newProduct.mnf_date}
              onChange={(e) => setNewProduct({ ...newProduct, mnf_date: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="Expiry Date"
              type="date"
              value={newProduct.exp_date}
              onChange={(e) => setNewProduct({ ...newProduct, exp_date: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setNewProduct({ ...newProduct, image: e.target.files?.[0] || null })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialog(false)}>Cancel</Button>
          <Button
            onClick={handleAddProduct}
            variant="contained"
            disabled={!newProduct.name || !newProduct.price || !newProduct.stock || !newProduct.categoryId}
          >
            Add Product
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, product: null })} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Product</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Product Name"
              value={editProduct.name}
              onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })}
              fullWidth
            />
            <TextField
              label="Description"
              value={editProduct.description}
              onChange={(e) => setEditProduct({ ...editProduct, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />
            <TextField
              label="Price"
              type="number"
              value={editProduct.price}
              onChange={(e) => setEditProduct({ ...editProduct, price: e.target.value })}
              fullWidth
            />
            <TextField
              label="Stock"
              type="number"
              value={editProduct.stock}
              onChange={(e) => setEditProduct({ ...editProduct, stock: e.target.value })}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={editProduct.categoryId}
                onChange={(e) => setEditProduct({ ...editProduct, categoryId: e.target.value })}
              >
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Manufacturing Date"
              type="date"
              value={editProduct.mnf_date}
              onChange={(e) => setEditProduct({ ...editProduct, mnf_date: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="Expiry Date"
              type="date"
              value={editProduct.exp_date}
              onChange={(e) => setEditProduct({ ...editProduct, exp_date: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setEditProduct({ ...editProduct, image: e.target.files?.[0] || null })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog({ open: false, product: null })}>Cancel</Button>
          <Button onClick={handleEditProduct} variant="contained">
            Update Product
          </Button>
        </DialogActions>
      </Dialog>

      {/* Discount Dialog */}
      <Dialog open={discountDialog.open} onClose={() => setDiscountDialog({ open: false, product: null })}>
        <DialogTitle>Update Discount</DialogTitle>
        <DialogContent>
          <TextField
            label="Discount Percentage"
            type="number"
            value={discountValue}
            onChange={(e) => setDiscountValue(e.target.value)}
            fullWidth
            helperText="Leave empty to remove discount"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDiscountDialog({ open: false, product: null })}>Cancel</Button>
          <Button onClick={handleUpdateDiscount} variant="contained">
            Update Discount
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default InventoryPage;