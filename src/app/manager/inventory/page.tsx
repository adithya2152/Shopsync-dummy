
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
import Image from "next/image";
import axios, { isAxiosError } from "axios";
import { toast } from "react-toastify";
import { useShopIdStore } from "@/store/ShopIdStore";

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
};

type Categories = {
  id: number;
  name: string;
};

const convertToCSV = (data: InventoryItem[], categories: Categories[]) => {
  const headers = ["Name", "Category", "Stock", "Price", "Manufacturing Date"];
  const rows = data.map((item) => [
    item.name,
    categories.find(cat => cat.id === item.categoryId)?.name || "Unknown",
    item.stock,
    item.price,
    item.mnf_date,
  ]);
  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
};

const InventoryPage = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState<string>("");
  const [category, setCategory] = useState<string>("All");
  const [categories, setCategories] = useState<Categories[]>([
    { id: 0, name: "All" }
  ]);
  const [loadings, setLoadings] = useState<boolean>(false);
  const { shopId } = useShopIdStore();

  const [openDialog, setOpenDialog] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<InventoryItem>>({})
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);


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
  try {
    const formData = new FormData();

    // Append product fields as JSON string
    formData.append("product", JSON.stringify(newProduct));
    formData.append("shopId", String(shopId));

    // Append image file
    if (selectedFile) {
      formData.append("image", selectedFile);
    }

    const response = await axios.post("/api/manager/addinventory", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (response.status === 200 || response.status === 201) {
      toast.success("Product added successfully");
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
    return sortConfig.direction === "asc"
      ? a[sortConfig.key] > b[sortConfig.key]
        ? 1
        : -1
      : a[sortConfig.key] < b[sortConfig.key]
      ? 1
      : -1;
  });

  const filteredInventory = sortedInventory.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());
    const productCategory = getCategoryName(product.categoryId).toLowerCase().trim();
    const selectedCategory = category.toLowerCase().trim();
    const matchesCategory = selectedCategory === "all" || productCategory === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleExportCSV = () => {
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
          console.log("Inventory fetched successfully:", res.data);
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
        } else {
          console.error("Failed to fetch categories:", res.statusText);
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
                  <TableCell>${product.price}</TableCell>
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
                      sx={{ color: "#5A9F6B", "&:hover": { color: "#3a7d4a" } }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      sx={{ color: "#d32f2f", "&:hover": { color: "#9a0007" } }}
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

      {/* Dialog */}
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
              onChange={(e) =>
                handleFieldChange("categoryId", e.target.value)
              }
              label="Category"
            >
              {categories
                .filter((cat) => cat.name !== "All") // prevent invalid selection
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
            Upload Image
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={handleImageChange}
            />
          </Button>
          {imagePreview && (
            <Image src={imagePreview} alt="Preview" width={100} height={100} />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={handleAddProduct}
            variant="contained"
            color="success"
          >
            Add Product
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default InventoryPage;