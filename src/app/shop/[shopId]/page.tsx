"use client";
import { use, useState, useEffect } from "react";
import Nav from "@/components/Nav";
import ClientCart, { Product } from "./ClientCart";
import { Typography, Container } from "@mui/material";
import axios, { isAxiosError } from "axios";
import { Toaster, toast } from "react-hot-toast";
import { useSearchParams } from "next/navigation";
import CouponDisplaySection, { Coupon } from "@/components/CouponSection";
import "@/styles/landing.css";

export default function ShopProducts({ params }: { params: Promise<{ shopId: string }> }) {
  const { shopId } = use(params);
  const searchParams = useSearchParams();
  const pdtId = searchParams.get("pdtId");

  // --- STATE ---
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [shopName, setShopName] = useState<string | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [highlightedPdtId, setHighlightedPdtId] = useState<string | null>(null);
  
  // State for the master list of all products from the API
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  // State for the products that are actually displayed (can be filtered)
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
  // State for the search input value
  const [searchTerm, setSearchTerm] = useState("");
  
  const shopIdInt = parseInt(shopId, 10);
  
  // --- EFFECTS ---
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
        setLoading(true); // Set loading at the start
        const authRes = await axios.get("/api/auth/is_auth");
        setIsAuthenticated(authRes.data.authenticated);
        if (!authRes.data.authenticated) toast("Browse as guest", { icon: "👤" });

        const shopRes = await axios.get(`/api/get_shops?shopId=${shopId}`);
        const name = shopRes.data;
        setShopName(name);
        document.title = `Products from ${name}`;

        const productRes = await axios.get(`/api/products?q=${shopId}`);
        if (productRes.status === 200 && productRes.data.products) {
          // **FIX 1: Set both the master list and the initial displayed list**
          setAllProducts(productRes.data.products);
          setDisplayedProducts(productRes.data.products);
          if (productRes.data.products.length === 0) {
            toast("No products available in this shop", { icon: "🛒" });
          }
        }

        const couponsRes = await axios.get(`/api/coupons?shopId=${shopId}`);
        if (couponsRes.status === 200 && couponsRes.data?.length > 0) {
          setCoupons(couponsRes.data);
        }
      } catch (error) {
        if(isAxiosError(error)) {
          toast.error(error.response?.data?.message || "Failed to load data");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [shopId]);

  // This effect handles the filtering logic
  useEffect(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    const filteredData = allProducts.filter((product) =>
      product.name.toLowerCase().includes(lowercasedFilter) ||
      (product.description && product.description.toLowerCase().includes(lowercasedFilter))
    );
    setDisplayedProducts(filteredData);
  }, [searchTerm, allProducts]); // Depends on the search term and the master list

  if (loading) return <div className="loader"></div>;

  // --- RENDER ---
  return (
    <div className="shop-products-root">
      <Toaster position="top-center" reverseOrder={false} />
      <Nav navType={isAuthenticated ? "customer" : "landing"} />
      
      {coupons.length > 0 && (
        <section className="Offers">
          <CouponDisplaySection coupons={coupons} />
        </section>
      )}

      <section>
        <Container>
          <Typography variant="h4" mt={6} mb={2} sx={{ textAlign: "center" }} className="section-title">
            Products from {shopName || "Shop"}
          </Typography>

          <search className="search-bar">
            <input
              type="text"
              placeholder="Search for products or descriptions in this shop..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={allProducts.length === 0}
            />
          </search>
          
          {/* **FIX 2: Check the length of the *displayed* products list** */}
          {displayedProducts.length > 0 ? (
            // **FIX 3: Pass the *displayed* products to the ClientCart**
            <ClientCart products={displayedProducts} shopId={shopIdInt} highlightedPdtId={highlightedPdtId} />
          ) : (
            <Typography align="center" sx={{ color: "text.secondary", mt: 4 }}>
              {/* Show a helpful message if the shop is empty vs. no search results */}
              {allProducts.length > 0 && searchTerm ? "No products match your search. 😕" : "No products available in this shop."}
            </Typography>
          )}
        </Container>
      </section>
    </div>
  );
}