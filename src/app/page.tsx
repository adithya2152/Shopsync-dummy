
"use client";

import "../styles/landing.css";
import { useState, useEffect } from "react";
import axios from "axios";
import {
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  Typography,
  Box,
  Container,
  Grid,
} from "@mui/material";
import Nav from "@/components/Nav";
import CouponDisplaySection, { Coupon } from "@/components/CouponSection";
import "@/loaders/spinner.css";
import { Toaster, toast } from "react-hot-toast";
import EmblaCarousel from "@/components/EmblaCarousel";

type Category = { id: number; name: string, imgPath?: string };
type Shop = { id: number; name: string };

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [visibleCat, setVisibleCat] = useState(5);
  const [visibleShop, setVisibleShop] = useState(5);
  const [coupons, setCoupons] = useState<Coupon[]>([]);

  const OPTIONS = { loop: true }
  const SLIDES = [
    {
      url: "https://clnzqekrbcgudfwlwbxt.supabase.co/storage/v1/object/public/categories/10.jpg",
      href: "/category/10"
    },
    {
      url: "https://clnzqekrbcgudfwlwbxt.supabase.co/storage/v1/object/public/categories/1.jpeg",
      href: "/category/1"
    },
  ]


  useEffect(() => {
    const fetchData = async () => {
      try {
        const authRes = await axios.get("/api/auth/is_auth");

        if (authRes.status === 200) {
          setIsAuthenticated(authRes.data.authenticated);
          if (!authRes.data.authenticated) {
            toast("Browsing as guest", { icon: "👤" });
          }
        }

        const [catRes, shopRes, couponRes] = await Promise.all([
          axios.get("/api/get_categories"),
          axios.get("/api/get_shops"),
          axios.get("/api/coupons")
        ]);

        if (couponRes.status === 200 && couponRes.data && couponRes.data.length > 0) {
          setCoupons(couponRes.data);
        }

        if (catRes.status === 200) setCategories(catRes.data);
        else toast.error("Failed to load categories.");

        if (shopRes.status === 200) setShops(shopRes.data);
        else toast.error("Failed to load shops.");
      } catch (err: unknown) {
        console.error("Initial load error:", err);
        toast.error("An error occurred while loading the page.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="loader" />;


  return (
    <div className="home-root">
      <Toaster position="top-center" reverseOrder={false} />

      <Nav navType={isAuthenticated ? "customer" : "landing"} />

      {/* Hero Section */}
      <section className="welcome-section">
        <Container>
          <Typography variant="h3" className="hero-title">
            Welcome to <strong>ShopSync</strong>
          </Typography>
          <Typography variant="h5" className="hero-subtitle">
            Delivery in just 25 minutes!
          </Typography>
        </Container>
      </section>

      <EmblaCarousel images={SLIDES} options={OPTIONS} />
      
      {coupons.length > 0 && (
      <section className="Offers">
        <CouponDisplaySection coupons={coupons} />
      </section>
      )}


      {/* Categories Section */}
      <section className="Offers">
        <Container>
          <Typography variant="h4" mb={5} className="section-title">Categories</Typography>
          <Grid container spacing={3}>
            {categories.slice(0, visibleCat).map((category) => (
              <Grid item xs={6} sm={6} md={4} lg={3} key={category.id}>
                <Card raised sx={cardStyle}>
                  <CardContent sx={{ textAlign: "center" }}>
                    <Typography variant="h6">{category.name}</Typography>
                    <CardMedia
                    sx={{height: 120, backgroundSize: "fit", backgroundColor: "#ffffff", borderRadius: "8px"}}
                    image={category.imgPath || "/images/placeholder.png"}
                    />   
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary", mt: 1 }}
                    >
                      Explore our {category.name} collection
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ justifyContent: "center" }}>
                    <Button
                      size="small"
                      onClick={() =>
                        (window.location.href = `/category/${category.id}`)
                      }
                    >
                      Shop Now &gt;
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          {visibleCat < categories.length && (
            <Box textAlign="center" mt={2}>
              <Button variant="outlined" onClick={() => setVisibleCat(visibleCat + 5)}>
                Explore More Categories
              </Button>
            </Box>
          )}
        </Container>
      </section>

      

      {/* Shops Section */}
      <section className="Offers">
        <Container>
          <Typography variant="h4" className="section-title">Shops</Typography>
          <Grid container spacing={3}>
            {shops.slice(0, visibleShop).map((shop) => (
              <Grid item xs={6} sm={6} md={4} lg={3} key={shop.id}>
                <Card raised sx={cardStyle}>
                  <CardContent sx={{ textAlign: "center", minHeight: 130 }}>
                    <Typography variant="h6">{shop.name}</Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary", mt: 1 }}>
                      Discover great deals from {shop.name}
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ justifyContent: "center" }}>
                    <Button
                      size="small"
                      onClick={() => (window.location.href = `/shop/${shop.id}`)}
                    >
                      View Details
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          {visibleShop < shops.length && (
            <Box textAlign="center" mt={2}>
              <Button variant="outlined" onClick={() => setVisibleShop(visibleShop + 5)}>
                Explore More Shops
              </Button>
            </Box>
          )}
        </Container>
      </section>
    </div>
  );
}

const cardStyle = {
  backgroundColor: "var(--glass-bg)",
  borderRadius: "var(--border-radius)",
  backdropFilter: "blur(12px)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  height: "100%",
};
