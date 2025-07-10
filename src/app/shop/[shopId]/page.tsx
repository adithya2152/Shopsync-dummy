"use client";
import { use, useState, useEffect } from "react";
import Nav from "@/components/Nav";
import ClientCart, { Product } from "./ClientCart";
import { Typography, Container } from "@mui/material";
import axios, { isAxiosError } from "axios";
import { Toaster, toast } from "react-hot-toast";
import { useSearchParams } from "next/navigation";
import "@/styles/landing.css"

export default function ShopProducts({ params }: { params: Promise<{ shopId: string }> }) {
  const { shopId } = use(params);
  const searchParams = useSearchParams();
  const pdtId = searchParams.get("pdtId");
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [shopName, setShopName] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [highlightedPdtId, setHighlightedPdtId] = useState<string | null>(null);
  
  const shopIdInt = parseInt(shopId, 10);
  
  useEffect(() => {
    if (!loading && pdtId) {
      setHighlightedPdtId(pdtId);
      const el = document.getElementById(`pdt-${pdtId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
  
      const timeout = setTimeout(() => {
        setHighlightedPdtId(null);
      }, 5000);
  
      return () => clearTimeout(timeout);
    }
  }, [loading, pdtId]);
  
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Step 1: Check Auth
        const authRes = await axios.get("/api/auth/is_auth");
        setIsAuthenticated(authRes.data.authenticated);
        if (!authRes.data.authenticated) toast("Browsing as guest", { icon: "👤" });

        // Step 2: Get Shop Name
        const shopRes = await axios.get(`/api/get_shops?shopId=${shopId}`);
        if (shopRes.status === 200) {
          const name = shopRes.data;
          setShopName(name);
          document.title = `Products from ${name}`;
          toast.success("Shop loaded successfully");
        } else {
          toast.error("Failed to fetch shop name");
          document.title = "Shop Products";
        }

        // Step 3: Get Products
        const productRes = await axios.get(`/api/products?q=${shopId}`);
        if (productRes.status === 200 && productRes.data.products) {
          setProducts(productRes.data.products);
          if (productRes.data.products.length === 0) {
            toast("No products available in this shop", { icon: "🛒" });
          } else {
            toast.success("Products loaded successfully");
          }
        } else {
          toast.error("Failed to load products");
        }
      } catch (error) {
        if(isAxiosError(error)) {
          if (error.response) {
            toast.error(`Error: ${error.response.data.message || "Failed to load data"}`);
          } else {
            toast.error("Network error, please try again later");
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [shopId]);

  if (loading) return <div className="loader"></div>;

  return (
    <div className="shop-products-root">
      <Toaster position="top-center" reverseOrder={false} />
      <Nav navType={isAuthenticated ? "customer" : "landing"} />

      <section className="Offers">
        <Container>
          <Typography variant="h4" mt={6} mb={6} sx={{ textAlign: "center" }} className="section-title">
            Products from {shopName || "Shop"}
          </Typography>
          {products.length > 0 ? (
            <ClientCart products={products} shopId={shopIdInt} highlightedPdtId={highlightedPdtId} />
          ) : (
            <Typography align="center" sx={{ color: "text.secondary" }}>
              No products available in this shop.
            </Typography>
          )}
        </Container>
      </section>
    </div>
  );
}
