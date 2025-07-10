"use client";
import { useEffect, useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Drawer,
  List,
  ListItemText,
  Divider,
  ButtonBase,
  Menu,
  MenuItem,
} from "@mui/material";
import { useRouter } from "next/navigation";
import MenuIcon from "@mui/icons-material/Menu";
import TranslateIcon from "@mui/icons-material/Translate";
import { useTranslationStore } from "../store/TranslationStore";
import "../styles/globals.css";
import axios from "axios";
import { toast } from "react-toastify";
import { useShopIdStore } from "@/store/ShopIdStore";

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: {
      translate: {
        TranslateElement: new (options: unknown, containerId: string) => void;
      };
    };
  }
}

type Shop = {
  id: number;
  name: string;
};

export default function ManagerNav() {
  const { isTranslated, isInitialized, toggleTranslation, setInitialized } = useTranslationStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShop, setSelectedShop] = useState<Shop>({ id: 0, name: "" });
  const [loading, setLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const router = useRouter();
  const {setShopId , shopId} = useShopIdStore();

  useEffect(() => {
  // Translation Setup
  if (!window.googleTranslateElementInit) {
    window.googleTranslateElementInit = () => {
      if (window.google?.translate?.TranslateElement) {
        new window.google.translate.TranslateElement(
          { pageLanguage: "en", includedLanguages: "te", layout: 0 },
          "google_translate_element"
        );
      }
      setInitialized();
    };

    const script = document.createElement("script");
    script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }

  // Shop Fetch Logic
  const fetchShops = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/manager/getShops");
      if (res.status === 200) {
        const data = res.data;
        setShops(data);
        if (data.length > 0) {
          const defaultShop = data[0];
          if (!shopId) {
            setSelectedShop(defaultShop);
            setShopId(defaultShop.id);
          } else {
            const matchedShop = data.find((shop: { id: number; }) => shop.id === shopId);
            setSelectedShop(matchedShop ?? defaultShop);
          }
        }
        console.log("Shops fetched successfully:", data);
      }
    } catch (error) {
      console.error("Error fetching shops:", error);
      toast.error("Failed to fetch shops. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  fetchShops();
}, [setInitialized, setShopId, shopId]);


  const handleTranslate = () => { 
    if (!isInitialized) return;
    console.log("Translation initialized");
    toggleTranslation();
    const translateSelect = document.querySelector(".goog-te-combo") as HTMLSelectElement;
    if (translateSelect) {
      translateSelect.value = isTranslated ? "en" : "te";
      translateSelect.dispatchEvent(new Event("change"));
    }
  };

  const handleShopClick = (event: React.MouseEvent<HTMLDivElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleShopSelect = (shop: Shop) => {
    setSelectedShop(shop);
    setShopId(shop.id);
    console.log("Store updated:",shopId);
    setAnchorEl(null);
  };

  const menuItems = [
    { text: "Inventory Management", path: "/manager/inventory" },
    { text: "Orders", path: "/manager/orders" },
    { text: "Deliveries", path: "/manager/deliveries" },
    { text: "Customer Management", path: "/manager/customerManagement" },
    { text: "Employee Management", path: "/manager/employeeManagement" },
  ];

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <AppBar position="static" elevation={3} sx={{ backgroundColor: "#91C99D", padding: "0.5rem", borderRadius: "15px" }}>
        <Toolbar sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
          <IconButton
            onClick={() => setMenuOpen(true)}
            sx={{
              color: "black",
              transition: "transform 0.2s ease",
              "&:hover": { transform: "scale(1.1)" },
            }}
          >
            <MenuIcon />
          </IconButton>

          <Typography
            variant="h5"
            sx={{
              fontWeight: "bold",
              color: "black",
              fontStyle: "italic",
              fontSize: "1.5rem",
              textShadow: "0 2px 10px rgba(255, 255, 255, 0.9)",
              cursor: "pointer",
            }}
            onClick={() => router.push("/")}
          >
            ShopSync
          </Typography>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem", cursor: "pointer" }} onClick={handleShopClick}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: "bold",
                color: "black",
                backgroundColor: "#91C99D",
                padding: "0.5rem 1rem",
                borderRadius: "10px",
                transition: "background-color 0.3s ease",
                "&:hover": {
                  backgroundColor: "#7FAC87",
                },
              }}
            >
              {selectedShop.name === "" ? "Select Shop" : "Welcome to "+selectedShop.name}
            </Typography>
          </div>

          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
            {shops.map((shop) => (
              <MenuItem key={shop.id} onClick={() => handleShopSelect(shop)}>
                {shop.name}
              </MenuItem>
            ))}
          </Menu>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <IconButton
              onClick={handleTranslate}
              sx={{
                color: isTranslated ? "green" : "black",
                transition: "transform 0.2s ease",
                "&:hover": { transform: "scale(1.1)" },
              }}
            >
              <TranslateIcon />
            </IconButton>

            <IconButton>
              <Avatar sx={{ bgcolor: "grey", color: "white", fontWeight: "bold" }} />
            </IconButton>
          </div>
        </Toolbar>

        <div id="google_translate_element" style={{ display: "none" }}></div>
      </AppBar>

      <Drawer anchor="left" open={menuOpen} onClose={() => setMenuOpen(false)}>
        <div style={{ width: "250px", padding: "1rem", backgroundColor: "#91C99D", height: "100%" }}>
          <Typography variant="h6" sx={{ fontWeight: "bold", color: "black", marginBottom: "1rem", marginTop: "1rem", textAlign: "center" }}>
            Admin Panel
          </Typography>
          <Divider sx={{ backgroundColor: "white" }} />
          <List>
            {menuItems.map(({ text, path }) => (
              <ButtonBase
                key={text}
                sx={{
                  display: "block",
                  width: "100%",
                  padding: "10px 15px",
                  borderRadius: "10px",
                  margin: "5px 0",
                  backgroundColor: "rgba(255, 255, 255, 0.3)",
                  transition: "transform 0.2s ease, background-color 0.3s ease",
                  "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.6)" },
                  "&:active": { transform: "scale(0.95)", backgroundColor: "rgba(255, 255, 255, 0.8)" },
                }}
                onClick={() => {
                  router.push(path);
                  setMenuOpen(false);
                }}
              >
                <ListItemText primary={text} sx={{ color: "black", fontWeight: "bold", textAlign: "center" }} />
              </ButtonBase>
            ))}
          </List>
        </div>
      </Drawer>
    </>
  );
}
