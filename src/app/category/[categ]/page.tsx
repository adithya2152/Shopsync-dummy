"use client";
import { use, useEffect, useState } from "react";
import Nav from "@/components/Nav";
import {
  Typography,
  Container,
  Card,
  CardContent,
  Box,
  CardMedia,
  CardActions,
  Button,
} from "@mui/material";
import axios, { isAxiosError } from "axios";
import { Toaster, toast } from "react-hot-toast";
import { useSearchParams } from "next/navigation";
import "@/styles/landing.css";

type Product = {
  id: number;
  name: string;
  price: number;
  description?: string;
  ImgPath?: string;
  discount?: number;
  shopId: number;
  shopName?: string;
};

export default function ShopProducts({ params }: { params: Promise<{ categ: string }> }) {
  const { categ } = use(params);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // State for the original list of all products fetched from the API
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  // State for the products that are currently being displayed (can be filtered)
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
  
  const [categName, setCategName] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  const searchParams = useSearchParams();
  const highlightedPdtId = searchParams.get("pdtId");

  // Effect for fetching initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const authRes = await axios.get("/api/auth/is_auth");
        setIsAuthenticated(authRes.data.authenticated);
        if (!authRes.data.authenticated) toast("Browse as guest", { icon: "👤" });

        const prodRes = await axios.get(`/api/get_categ_pdts?categId=${encodeURIComponent(categ)}`);
        // Set both the master list and the displayed list
        setAllProducts(prodRes.data.products);
        setDisplayedProducts(prodRes.data.products);
        setCategName(prodRes.data.categoryName || categ);
      } catch (error) {
        if(isAxiosError(error)) {
          console.error("Error fetching data:", error);
          toast.error(error?.response?.data?.error || "Something went wrong");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [categ]);

  // Effect for handling search filtering
  useEffect(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    const filteredData = allProducts.filter((product) =>
      product.name.toLowerCase().includes(lowercasedFilter) ||
      (product.description && product.description.toLowerCase().includes(lowercasedFilter)) ||
      (product.shopName && product.shopName.toLowerCase().includes(lowercasedFilter))
    );
    setDisplayedProducts(filteredData);
  }, [searchTerm, allProducts]); // Re-run whenever searchTerm or the master list changes

  if (loading) return <div className="loader"></div>;

  return (
    <div className="shop-products-root">
      <Toaster position="top-center" reverseOrder={false} />
      <Nav navType={isAuthenticated ? "customer" : "landing"} />

      <section className="Offers">
        <Container>
          {/* Functional and styled search feature */}
          <search className="search-bar">
            <input
              type="text"
              placeholder="Search by product, description, or shop..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </search>
          
          <Typography variant="h4" mt={4} mb={4} sx={{ textAlign: "center" }} className="section-title">
            Products in {categName}
          </Typography>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "15px",
              justifyContent: "center",
              marginTop: "10px",
            }}
          >
            {displayedProducts.length > 0 ? (
              displayedProducts.map((product) => {
                const isHighlighted = highlightedPdtId === String(product.id);
                const cardStyle = {
                  border: isHighlighted ? "2px solid #3b82f6" : "1px solid transparent",
                  boxShadow: isHighlighted ? "0 0 10px rgba(59, 130, 246, 0.4)" : undefined,
                  transition: "all 0.5s ease",
                };

                return (
                  <Box id={`pdt-${product.id}`} key={product.id} sx={{ minWidth: 250, margin: "10px" }}>
                    <Card raised={true} sx={{ ...cardStyle }}>
                      <CardMedia
                        sx={{ height: 120, backgroundSize: "contain", backgroundColor: "#ffffff" }}
                        image={product.ImgPath || "/placeholder.png"}
                      />    
                      <CardContent>
                        <Typography variant="h6" component="div">
                          {product.name}
                        </Typography>
                        <Typography sx={{ fontSize: "0.875rem", color: "text.secondary", mb: 1.5, height: '40px', overflow: 'hidden' }}>
                          {product.description}
                        </Typography>
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
                        <Typography variant="subtitle1" component="div" sx={{ mt: 1 }}>
                          Sold by: {product.shopName}
                        </Typography>
                      </CardContent>
                      <CardActions>
                        <Button size="small" href={`/shop/${product.shopId}?pdtId=${product.id}`} variant="contained">
                          Visit Shop
                        </Button>
                      </CardActions>
                    </Card>
                  </Box>
                );
              })
            ) : (
              <Typography sx={{ mt: 4, textAlign: 'center', color: 'text.secondary' }}>
                No products found matching your search. 😕
              </Typography>
            )}
          </div>
        </Container>
      </section>
    </div>
  );
}