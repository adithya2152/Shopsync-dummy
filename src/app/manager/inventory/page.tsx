"use client";
import { useState, useEffect } from "react";
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
  Button,
  IconButton,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  TableSortLabel,
  Alert,
  Box,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import SearchIcon from "@mui/icons-material/Search";
import LocalOfferIcon from "@mui/icons-material/LocalOffer"; // Import discount icon
import Image from "next/image";
import axios, { isAxiosError } from "axios";
import { toast } from "react-toastify";
import { useShopIdStore } from "@/store/ShopIdStore";

// 1. Update InventoryItem type to include discount
type InventoryItem = {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  mnf_date: string;
  categoryId: number;
  shopId: number;
  imgPath: string;
  createdAt: string;
  discount?: number | null; // Discount in percentage
};

type Categories = {
  id: number;
  name: string;
};

// 2. Update CSV conversion to include discount
const convertToCSV = (data: InventoryItem[], categories: Categories[]) => {
  const headers = [
    "Name",
    "Category",
    "Stock",
    "Price",
    "Discount (%)",
    "Manufacturing Date",
  ];
  const rows = data.map((item) => [
    item.name,
    categories.find((cat) => cat.id === item.categoryId)?.name || "Unknown",
    item.stock,
    item.price,
    item.discount || 0, // Add discount data
    item.mnf_date,
  ]);
  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
};

const InventoryPage = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState<string>("");
  const [category, setCategory] = useState<string>("All");
  const [categories, setCategories] = useState<Categories[]>([
    { id: 0, name: "All" },
  ]);
  const [loadings, setLoadings] = useState<boolean>(false);
  const { shopId } = useShopIdStore();

  const [openDialog, setOpenDialog] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<InventoryItem>>({});
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // --- State for Discount Dialog ---
  const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<InventoryItem | null>(
    null
  );
  const [newDiscount, setNewDiscount] = useState<string>("");

  // --- State for Edit Dialog ---
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] =
    useState<Partial<InventoryItem> | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [editSelectedFile, setEditSelectedFile] = useState<File | null>(null);

  // --- State for Delete Dialog ---
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null
  );

  // --- Loading states for buttons ---
  const [isAdding, setIsAdding] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSavingDiscount, setIsSavingDiscount] = useState(false);
  const [isRemovingDiscount, setIsRemovingDiscount] = useState(false);

  const handleOpenEditDialog = (product: InventoryItem) => {
    setEditingProduct(product);
    setEditImagePreview(product.imgPath || null);
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setEditingProduct(null);
    setEditImagePreview(null);
    setEditSelectedFile(null);
  };

  const handleEditFieldChange = (
    field: keyof InventoryItem,
    value: string | number | null
  ) => {
    setEditingProduct((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setEditSelectedFile(file);
      setEditImagePreview(previewUrl);
    }
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;
    setIsUpdating(true);
    try {
      const formData = new FormData();
      formData.append("product", JSON.stringify(editingProduct));
      formData.append("shopId", String(shopId));
      if (editSelectedFile) {
        formData.append("image", editSelectedFile);
      }

      const response = await axios.put(
        `/api/manager/updateinventory`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (response.status === 200) {
        toast.success("Product updated successfully");
        setInventory((prev) =>
          prev.map((p) => (p.id === editingProduct.id ? response.data : p))
        );
        handleCloseEditDialog();
      } else {
        toast.error("Failed to update product.");
      }
    } catch (error) {
      console.error("Update Product Error:", error);
      toast.error("An unexpected error occurred while updating the product.");
    } finally {
      setIsUpdating(false);
    }
  };

  // --- Delete Product Functions ---
  const handleOpenDeleteDialog = (productId: number) => {
    setSelectedProductId(productId);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setSelectedProductId(null);
    setDeleteDialogOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!selectedProductId) return;
    setIsDeleting(true);
    try {
      // **TODO: Implement your backend endpoint for deleting**
      const response = await axios.delete(
        `/api/manager/deleteinventory?productId=${selectedProductId}&shopId=${shopId}`
      );

      if (response.status === 200) {
        toast.success("Product deleted successfully!");
        setInventory((prev) => prev.filter((p) => p.id !== selectedProductId));
        handleCloseDeleteDialog();
      } else {
        toast.error("Failed to delete product.");
      }
    } catch (error) {
      toast.error("Failed to delete product.");
      console.error("Delete Product Error:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const getCategoryName = (id: number): string => {
    const match = categories.find((cat) => cat.id === id);
    return match ? match.name : "Unknown";
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setSelectedFile(file);
      setImagePreview(previewUrl);
    }
  };

  const handleFieldChange = (
    field: keyof InventoryItem,
    value: string | number | Date | null
  ) => {
    setNewProduct((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddProduct = async () => {
    setIsAdding(true);
    try {
      const formData = new FormData();
      formData.append("product", JSON.stringify(newProduct));
      formData.append("shopId", String(shopId));
      if (selectedFile) {
        formData.append("image", selectedFile);
      }

      const response = await axios.post("/api/manager/addinventory", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.status === 200 || response.status === 201) {
        toast.success("Product added successfully");
        // Add new product to local state to avoid refetching
        setInventory((prev) => [response.data, ...prev]);
        setOpenDialog(false);
        setNewProduct({});
        setImagePreview(null);
        setSelectedFile(null);
      } else {
        toast.error("Failed to add product. Try again.");
      }
    } catch (error) {
      console.error("Add Product Error:", error);
      if (isAxiosError(error)) {
        toast.error(error.response?.data?.message || "Failed to add product.");
      } else {
        toast.error("An unexpected error occurred.");
      }
    } finally {
      setIsAdding(false);
    }
  };

  // --- Functions for Discount Management ---
  const handleOpenDiscountDialog = (product: InventoryItem) => {
    setSelectedProduct(product);
    setNewDiscount(product.discount?.toString() || "");
    setDiscountDialogOpen(true);
  };

  const handleCloseDiscountDialog = () => {
    setDiscountDialogOpen(false);
    setSelectedProduct(null);
    setNewDiscount("");
  };

  const handleSaveDiscount = async () => {
    if (!selectedProduct) return;
    const discountValue = newDiscount ? parseFloat(newDiscount) : null;
    setIsSavingDiscount(true);
    try {
      const response = await axios.put(
        `/api/manager/updatediscount?shopId=${shopId}`,
        {
          productId: selectedProduct.id,
          discount: discountValue,
        }
      );

      if (response.status === 200) {
        toast.success("Discount updated successfully!");
        // Update local state
        setInventory(
          inventory.map((p) =>
            p.id === selectedProduct.id ? { ...p, discount: discountValue } : p
          )
        );
        handleCloseDiscountDialog();
      }
    } catch (error) {
      toast.error("Failed to update discount.");
      console.error("Update Discount Error:", error);
    } finally {
      setIsSavingDiscount(false);
    }
  };

  const handleRemoveDiscount = async () => {
    if (!selectedProduct) return;
    setIsRemovingDiscount(true);
    try {
      const response = await axios.put(
        `/api/manager/updatediscount?shopId=${shopId}`,
        {
          productId: selectedProduct.id,
          discount: null, // Send null to remove
        }
      );

      if (response.status === 200) {
        toast.success("Discount removed successfully!");
        // Update local state
        setInventory(
          inventory.map((p) =>
            p.id === selectedProduct.id ? { ...p, discount: null } : p
          )
        );
        handleCloseDiscountDialog();
      }
    } catch (error) {
      toast.error("Failed to remove discount.");
      console.error("Remove Discount Error:", error);
    } finally {
      setIsRemovingDiscount(false);
    }
  };

  const [sortConfig, setSortConfig] = useState<{
    key: keyof InventoryItem;
    direction: "asc" | "desc" | undefined;
  }>({
    key: "stock",
    direction: "asc",
  });

  const sortedInventory = [...inventory].sort((a, b) => {
    if (!sortConfig.direction) return 0;
    // Handle potentially null/undefined values for sorting
    const valA = a[sortConfig.key] ?? 0;
    const valB = b[sortConfig.key] ?? 0;
    return sortConfig.direction === "asc"
      ? valA > valB
        ? 1
        : -1
      : valA < valB
      ? 1
      : -1;
  });

  const filteredInventory = sortedInventory.filter((product) => {
  // Use (product.name || '') to provide an empty string as a fallback
  const matchesSearch = (product.name || '') 
    .toLowerCase()
    .includes(search.toLowerCase());
  
  const productCategory = getCategoryName(product.categoryId)
    .toLowerCase()
    .trim();
  const selectedCategory = category.toLowerCase().trim();
  const matchesCategory =
    selectedCategory === "all" || productCategory === selectedCategory;
    
  return matchesSearch && matchesCategory;
});

  const handleExportCSV = () => {
    if (filteredInventory.length === 0) {
      toast.error("No products to export.");
      return;
    }
    const csv = convertToCSV(filteredInventory, categories);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `inventory_${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isDateCloseToToday = (dateStr: string) => {
    const today = new Date();
    const mnfDate = new Date(dateStr);
    const diffTime = Math.abs(today.getTime() - mnfDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30;
  };

  const hasRecentMnfProducts = inventory.some((item) =>
    isDateCloseToToday(item.mnf_date)
  );

  useEffect(() => {
    if (shopId === 0) return;

    const fetchInventory = async () => {
      setLoadings(true);
      try {
        const res = await axios.get(
          `/api/manager/getinventory?shopId=${shopId}`
        );
        if (res.status === 200) {
          setInventory(res.data);
        }
      } catch (error) {
        console.error("Error fetching inventory:", error);
        toast.error("Failed to fetch inventory.");
      } finally {
        setLoadings(false);
      }
    };
    const fetchCat = async () => {
      try {
        const res = await axios.get("/api/get_categories");
        if (res.status === 200) {
          setCategories([{ id: 0, name: "All" }, ...res.data]);
        }
      } catch (error) {
        if (isAxiosError(error)) {
          console.error("Error fetching categories:", error.response?.data);
          toast.error("Failed to fetch categories.");
        }
      }
    };

    fetchInventory();
    fetchCat();
  }, [shopId]);

  if (loadings) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container sx={{ padding: "20px", minHeight: "90vh" }}>
      <Typography variant="h4" sx={{ fontWeight: "bold", mb: 2 }}>
        Inventory Management
      </Typography>

      {inventory.some((item) => item.stock < 5) && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Some products are running low on stock!
        </Alert>
      )}
      {hasRecentMnfProducts && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Recently manufactured products detected!
        </Alert>
      )}

      <Box display="flex" justifyContent="space-between" mb={2}>
        <TextField
          label="Search Products"
          variant="outlined"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: "30%" }}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1 }} />,
          }}
        />

        <FormControl size="small" sx={{ width: "20%" }}>
          <InputLabel>Category</InputLabel>
          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            label="Category"
          >
            {categories.map((cat) => (
              <MenuItem key={cat.id} value={cat.name}>
                {cat.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="contained"
          color="success"
          startIcon={<DownloadIcon />}
          onClick={handleExportCSV}
        >
          Export CSV
        </Button>
      </Box>

      <TableContainer
        component={Paper}
        sx={{ borderRadius: 2, maxHeight: 500 }}
      >
        <Table stickyHeader>
          <TableHead sx={{ backgroundColor: "#5A9F6B" }}>
            {/* 3. Add Discount to Table Header */}
            <TableRow>
              <TableCell
                sx={{
                  color: "white",
                  fontWeight: "bold",
                  backgroundColor: "#5A9F6B",
                }}
              >
                Image
              </TableCell>
              <TableCell
                sx={{
                  color: "white",
                  fontWeight: "bold",
                  backgroundColor: "#5A9F6B",
                }}
              >
                <TableSortLabel
                  active={sortConfig.key === "name"}
                  direction={
                    sortConfig.key === "name" ? sortConfig.direction : "asc"
                  }
                  sx={{
                    color: "white !important",
                    "&:hover": { color: "white" },
                  }}
                  onClick={() =>
                    setSortConfig({
                      key: "name",
                      direction:
                        sortConfig.direction === "asc" ? "desc" : "asc",
                    })
                  }
                >
                  Product
                </TableSortLabel>
              </TableCell>
              <TableCell
                sx={{
                  color: "white",
                  fontWeight: "bold",
                  backgroundColor: "#5A9F6B",
                }}
              >
                Category
              </TableCell>
              <TableCell
                sx={{
                  color: "white",
                  fontWeight: "bold",
                  backgroundColor: "#5A9F6B",
                }}
              >
                <TableSortLabel
                  active={sortConfig.key === "stock"}
                  direction={
                    sortConfig.key === "stock" ? sortConfig.direction : "asc"
                  }
                  sx={{
                    color: "white !important",
                    "&:hover": { color: "white" },
                  }}
                  onClick={() =>
                    setSortConfig({
                      key: "stock",
                      direction:
                        sortConfig.direction === "asc" ? "desc" : "asc",
                    })
                  }
                >
                  Stock
                </TableSortLabel>
              </TableCell>
              <TableCell
                sx={{
                  color: "white",
                  fontWeight: "bold",
                  backgroundColor: "#5A9F6B",
                }}
              >
                <TableSortLabel
                  active={sortConfig.key === "price"}
                  direction={
                    sortConfig.key === "price" ? sortConfig.direction : "asc"
                  }
                  sx={{
                    color: "white !important",
                    "&:hover": { color: "white" },
                  }}
                  onClick={() =>
                    setSortConfig({
                      key: "price",
                      direction:
                        sortConfig.direction === "asc" ? "desc" : "asc",
                    })
                  }
                >
                  Price
                </TableSortLabel>
              </TableCell>
              {/* New Discount Header Cell */}
              <TableCell
                sx={{
                  color: "white",
                  fontWeight: "bold",
                  backgroundColor: "#5A9F6B",
                }}
              >
                <TableSortLabel
                  active={sortConfig.key === "discount"}
                  direction={
                    sortConfig.key === "discount" ? sortConfig.direction : "asc"
                  }
                  sx={{
                    color: "white !important",
                    "&:hover": { color: "white" },
                  }}
                  onClick={() =>
                    setSortConfig({
                      key: "discount",
                      direction:
                        sortConfig.direction === "asc" ? "desc" : "asc",
                    })
                  }
                >
                  Discount
                </TableSortLabel>
              </TableCell>
              <TableCell
                sx={{
                  color: "white",
                  fontWeight: "bold",
                  backgroundColor: "#5A9F6B",
                }}
              >
                <TableSortLabel
                  active={sortConfig.key === "mnf_date"}
                  direction={
                    sortConfig.key === "mnf_date" ? sortConfig.direction : "asc"
                  }
                  sx={{
                    color: "white !important",
                    "&:hover": { color: "white" },
                  }}
                  onClick={() =>
                    setSortConfig({
                      key: "mnf_date",
                      direction:
                        sortConfig.direction === "asc" ? "desc" : "asc",
                    })
                  }
                >
                  Mnf Date
                </TableSortLabel>
              </TableCell>
              <TableCell
                sx={{
                  color: "white",
                  fontWeight: "bold",
                  backgroundColor: "#5A9F6B",
                }}
              >
                Actions
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredInventory.map((product, index) => {
              // Ensure price and discount are treated as numbers for calculation
              const numericPrice = Number(product.price);
              const numericDiscount = Number(product.discount ?? 0); // FIX: Default null discount to 0

              // Calculate discounted price safely
              const finalPrice = numericPrice * (1 - numericDiscount / 100);

              return (
                <TableRow
                  key={product.id}
                  sx={{
                    backgroundColor: index % 2 === 0 ? "#f9f9f9" : "white",
                    "&:hover": { backgroundColor: "#f0f0f0" },
                  }}
                >
                  <TableCell>
                    <Image
                      src={
                        product.imgPath && product.imgPath.startsWith("http")
                          ? product.imgPath
                          : "/images/placeholder.png"
                      }
                      alt={product.name}
                      width={50}
                      height={50}
                      style={{ borderRadius: "5px" }}
                    />
                  </TableCell>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{getCategoryName(product.categoryId)}</TableCell>
                  <TableCell
                    sx={{
                      color: product.stock < 5 ? "#d32f2f" : "inherit",
                      fontWeight: product.stock < 5 ? "bold" : "normal",
                    }}
                  >
                    {product.stock}
                  </TableCell>

                  <TableCell>
                    {numericDiscount > 0 ? (
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{
                            textDecoration: "line-through",
                            color: "text.secondary",
                          }}
                        >
                          ₹{numericPrice.toFixed(2)}
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{ color: "success.main", fontWeight: "bold" }}
                        >
                          ₹{finalPrice.toFixed(2)}
                        </Typography>
                      </Box>
                    ) : (
                      // FIX: Change currency symbol to ₹
                      `₹${numericPrice.toFixed(2)}`
                    )}
                  </TableCell>

                  <TableCell
                    sx={{
                      color: numericDiscount > 0 ? "green" : "inherit",
                      fontWeight: numericDiscount > 0 ? "bold" : "normal",
                    }}
                  >
                    {/* FIX: Check against null to correctly display 0% */}
                    {product.discount != null ? `${product.discount}%` : "N/A"}
                  </TableCell>

                  <TableCell
                    sx={{
                      color: isDateCloseToToday(product.mnf_date)
                        ? "#1976d2"
                        : "inherit",
                      fontWeight: isDateCloseToToday(product.mnf_date)
                        ? "bold"
                        : "normal",
                    }}
                  >
                    {new Date(product.mnf_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      sx={{ color: "#f57c00", "&:hover": { color: "#ef6c00" } }}
                      onClick={() => handleOpenDiscountDialog(product)}
                    >
                      <LocalOfferIcon />
                    </IconButton>
                    <IconButton
                      sx={{ color: "#5A9F6B", "&:hover": { color: "#3a7d4a" } }}
                      onClick={() => handleOpenEditDialog(product)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      sx={{ color: "#d32f2f", "&:hover": { color: "#9a0007" } }}
                      onClick={() => handleOpenDeleteDialog(product.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Floating Add Button */}
      <IconButton
        onClick={() => setOpenDialog(true)}
        sx={{
          position: "fixed",
          bottom: "30px",
          right: "30px",
          backgroundColor: "#5A9F6B",
          color: "white",
          width: "75px",
          height: "75px",
          borderRadius: "50%",
          boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)",
          "&:hover": { backgroundColor: "#4A8D5A" },
        }}
      >
        <AddIcon sx={{ fontSize: 40 }} />
      </IconButton>

      {/* Add Product Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Add New Inventory</DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
        >
          <TextField
            label="Product Name"
            value={newProduct?.name || ""}
            onChange={(e) => handleFieldChange("name", e.target.value)}
          />
          <FormControl fullWidth>
            <InputLabel>Category</InputLabel>
            <Select
              value={newProduct.categoryId ?? ""}
              onChange={(e) => handleFieldChange("categoryId", e.target.value)}
              label="Category"
            >
              {categories
                .filter((cat) => cat.name !== "All")
                .map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
          <TextField
            label="Stock"
            type="number"
            value={newProduct.stock || ""}
            onChange={(e) =>
              handleFieldChange("stock", parseInt(e.target.value))
            }
          />
          <TextField
            label="Price"
            type="number"
            value={newProduct.price || ""}
            onChange={(e) =>
              handleFieldChange("price", parseFloat(e.target.value))
            }
          />
          {/* Add discount field to the add product form */}
          <TextField
            label="Discount (%)"
            type="number"
            value={newProduct.discount || ""}
            onChange={(e) =>
              handleFieldChange("discount", parseFloat(e.target.value))
            }
          />
          <TextField
            label="Manufacturing Date"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={newProduct.mnf_date || ""}
            onChange={(e) => handleFieldChange("mnf_date", e.target.value)}
          />
          <TextField
            label="Description"
            multiline
            minRows={2}
            value={newProduct.description || ""}
            onChange={(e) => handleFieldChange("description", e.target.value)}
          />
          <Button component="label" variant="outlined">
            {" "}
            Upload Image{" "}
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={handleImageChange}
            />{" "}
          </Button>
          {imagePreview && (
            <Image src={imagePreview} alt="Preview" width={100} height={100} />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} disabled={isAdding}>
            Cancel
          </Button>
          <Button
            onClick={handleAddProduct}
            variant="contained"
            color="success"
            disabled={isAdding}
          >
            {isAdding ? "Adding..." : "Add Product"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 5. Add Dialog for Managing Discounts */}
      <Dialog
        open={discountDialogOpen}
        onClose={handleCloseDiscountDialog}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Manage Discount</DialogTitle>
        <DialogContent>
          <Typography variant="h6" gutterBottom>
            {selectedProduct?.name}
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Discount (%)"
            type="number"
            fullWidth
            variant="outlined"
            value={newDiscount}
            onChange={(e) => setNewDiscount(e.target.value)}
            InputProps={{
              inputProps: { min: 0, max: 100 },
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleRemoveDiscount}
            color="error"
            disabled={isRemovingDiscount || isSavingDiscount}
          >
            {isRemovingDiscount ? "Removing..." : "Remove Discount"}
          </Button>
          <Button
            onClick={handleCloseDiscountDialog}
            disabled={isRemovingDiscount || isSavingDiscount}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveDiscount}
            variant="contained"
            color="success"
            disabled={isRemovingDiscount || isSavingDiscount}
          >
            {isSavingDiscount ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={handleCloseEditDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Edit Inventory Item</DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
        >
          {editingProduct && (
            <>
              <TextField
                sx={{ mt: 2 }}
                label="Product Name"
                value={editingProduct.name || ""}
                onChange={(e) => handleEditFieldChange("name", e.target.value)}
              />
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={editingProduct.categoryId ?? ""}
                  onChange={(e) =>
                    handleEditFieldChange("categoryId", e.target.value as number)
                  }
                  label="Category"
                >
                  {categories
                    .filter((cat) => cat.name !== "All")
                    .map((cat) => (
                      <MenuItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
              <TextField
                label="Stock"
                type="number"
                value={editingProduct.stock || ""}
                onChange={(e) =>
                  handleEditFieldChange("stock", parseInt(e.target.value))
                }
              />
              <TextField
                label="Price"
                type="number"
                value={editingProduct.price || ""}
                onChange={(e) =>
                  handleEditFieldChange("price", parseFloat(e.target.value))
                }
              />
              <TextField
                label="Discount (%)"
                type="number"
                value={editingProduct.discount || ""}
                onChange={(e) =>
                  handleEditFieldChange("discount", parseFloat(e.target.value))
                }
              />
              <TextField
                label="Manufacturing Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={
                  editingProduct.mnf_date
                    ? new Date(editingProduct.mnf_date)
                        .toISOString()
                        .split("T")[0]
                    : ""
                }
                onChange={(e) =>
                  handleEditFieldChange("mnf_date", e.target.value)
                }
              />
              <TextField
                label="Description"
                multiline
                minRows={2}
                value={editingProduct.description || ""}
                onChange={(e) =>
                  handleEditFieldChange("description", e.target.value)
                }
              />
              <Button component="label" variant="outlined">
                {" "}
                Upload New Image{" "}
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleEditImageChange}
                />{" "}
              </Button>
              {editImagePreview && (
                <Image
                  src={editImagePreview}
                  alt="Preview"
                  width={100}
                  height={100}
                />
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog} disabled={isUpdating}>
            Cancel
          </Button>
          <Button
            onClick={handleUpdateProduct}
            variant="contained"
            color="primary"
            disabled={isUpdating}
          >
            {isUpdating ? "Saving..." : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* --- NEW: Delete Confirmation Dialog --- */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the product &quot;
            {inventory.find((p) => p.id === selectedProductId)?.name}&quot;?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default InventoryPage;