"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardActions,
  Button,
  Typography,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Rating,
  Grid
} from "@mui/material";
import CardMedia from '@mui/material/CardMedia';
import { Toaster, toast } from "react-hot-toast";

export interface CartItem {
  id: number;
  name: string;
  quantity: number;
}

export interface Product {
  id: number;
  shopId: number;
  name: string;
  description?: string;
  price: number;
  stock: number;
  mnf_date?: Date;
  exp_date?: Date;
  categoryId?: number;
  discount?: number;
  imgPath?: string; 
  rating?: number;
}

interface ClientCartProps {
  products: Product[];
  shopId: number;
  highlightedPdtId?: string | null;
}

export default function ClientCart({ products, highlightedPdtId }: ClientCartProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentShopId, setCurrentShopId] = useState<number | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<Product | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem("cart") || "[]");
    const storedShopId = localStorage.getItem("currentShopId");
    if (storedCart.length > 0) {
      setCart(storedCart);
    }
    if (storedShopId) setCurrentShopId(parseInt(storedShopId, 10));

    setInitialized(true);
  }, []);

  useEffect(() => {
    if (!initialized) return;
    localStorage.setItem("cart", JSON.stringify(cart));
    if (currentShopId !== null) {
      localStorage.setItem("currentShopId", currentShopId.toString());
    }
  }, [cart, currentShopId , initialized]);

  const addToCart = (product: Product) => {
    if (currentShopId !== null && currentShopId !== product.shopId && cart.length > 0) {
      setPendingProduct(product);
      setShowWarning(true);
      return;
    }

    if (cart.length === 0 || currentShopId === null) {
      setCurrentShopId(product.shopId);
    }

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (product.stock <= 0) {
        toast.error("This product is out of stock.");
        return prevCart;
      }
      if (existingItem && existingItem.quantity >= (product.stock)) {
        toast.error("You have reached the maximum stock limit for this product.");
        return prevCart;
      }
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, { id: product.id, name: product.name, quantity: 1 }];
      }
    });
  };

  const removeFromCart = (productId: number) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === productId);
      if (existingItem && existingItem.quantity > 1) {
        return prevCart.map(item =>
          item.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      } else {
        return prevCart.filter(item => item.id !== productId);
      }
    });
  };

  const getProductQuantity = (productId: number) => {
    const item = cart.find(item => item.id === productId);
    return item ? item.quantity : 0;
  };

  function handleCloseWarning() {
    if (pendingProduct) {
      // Clear previous cart and set new shopId
      const newProduct = pendingProduct;
      setCart([{ id: newProduct.id, name: newProduct.name, quantity: 1 }]);
      setCurrentShopId(newProduct.shopId);
      setPendingProduct(null);
    }
    setShowWarning(false);
  }

  function handleCancelWarning() {
    setPendingProduct(null);
    setShowWarning(false);
  }

  console.log("Products in /shops" , products);
  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
  
      <Grid container spacing={2} justifyContent="center" sx={{ marginTop: "10px" }}>
        {products.map(product => {
          const quantity = getProductQuantity(product.id);
          const isHighlighted = highlightedPdtId === String(product.id);
  
          const cardStyle = {
            border: isHighlighted ? "2px solid #3b82f6" : "1px solid transparent",
            boxShadow: isHighlighted ? "0 0 10px rgba(59, 130, 246, 0.4)" : undefined,
            transition: "all 0.5s ease",
          };
  
          return (
            <Grid item xs={6} sm={4} md={3} key={product.id}>
              <Box id={`pdt-${product.id}`} sx={{ minWidth: 150 }}>
                <Card raised={true} sx={cardStyle}>
                  <CardMedia
                    sx={{ height: 120, backgroundSize: "contain", backgroundColor: "#ffffff" }}
                    image={product.imgPath || "/placeholder.png"}
                  />
                  <CardContent>
                    <Typography variant="h6" component="div">
                      {product.name}
                    </Typography>
                    <Typography sx={{ fontSize: "0.875rem", color: "text.secondary", mb: 1.5 }}>
                      {product.description}
                    </Typography>
                    {product.rating && (
                      <Rating value={product.rating} readOnly />
                    )}
                    <Typography sx={{ fontSize: "1.25rem", fontWeight: "bold" }}>
                      {product.discount && product.discount > 0 && (
                        <>
                          <span style={{ color: "red", marginRight: "5px", fontWeight: "lighter" }}>
                            -{product.discount}%
                          </span>
                          <span style={{ textDecoration: "line-through", color: "gray", fontSize: "0.875rem" }}>
                            ₹{product.price}
                          </span>
                        </>
                      )}
                      <span style={{ marginLeft: "5px" }}>
                        ₹{(product.price * (1 - (product.discount || 0) / 100)).toFixed(2)}
                      </span>
                    </Typography>
                  </CardContent>
                  <CardActions>
                    {quantity > 0 ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <Button size="small" onClick={() => removeFromCart(product.id)} variant="outlined">-</Button>
                        <Typography>{quantity}</Typography>
                        <Button size="small" onClick={() => addToCart(product)} variant="outlined">+</Button>
                      </div>
                    ) : (
                      <Button
                        size="small"
                        disabled={product.stock <= 0}
                        onClick={() => addToCart(product)}
                        variant="contained"
                      >
                        {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                      </Button>
                    )}
                  </CardActions>
                </Card>
              </Box>
            </Grid>
          );
        })}
      </Grid>
  
      <Dialog open={showWarning} onClose={handleCancelWarning}>
        <DialogTitle>Cannot order from multiple shops</DialogTitle>
        <DialogContent dividers>
          <Typography gutterBottom>
            Your cart contains items from a different shop. Adding this item will clear your current cart.
          </Typography>
          <Typography gutterBottom>
            Do you want to clear your previous cart and add this item?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="text" onClick={handleCancelWarning}>Cancel</Button>
          <Button variant="contained" onClick={handleCloseWarning}>Add Item</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
