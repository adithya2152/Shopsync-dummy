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
  CircularProgress,
  ListItemIcon,
} from "@mui/material";
import { useRouter } from "next/navigation";
import MenuIcon from "@mui/icons-material/Menu";
import TranslateIcon from "@mui/icons-material/Translate";
import PersonIcon from "@mui/icons-material/Person";
import LogoutIcon from "@mui/icons-material/Logout";
import { useTranslationStore } from "../store/TranslationStore";
import "../styles/globals.css";
import axios, { isAxiosError } from "axios";
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
  const { setShopId, shopId } = useShopIdStore();
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [loadingShops, setLoadingShops] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [shopAnchorEl, setShopAnchorEl] = useState<null | HTMLElement>(null);
  const [profileAnchorEl, setProfileAnchorEl] = useState<null | HTMLElement>(null);

  // --- 1. useEffect for Google Translate (Runs Only Once) ---
  useEffect(() => {
    if (document.querySelector('script[src*="translate.google.com"]')) {
      return;
    }
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
  }, [setInitialized]);

  // --- 2. useEffect for Fetching Shops ---
  useEffect(() => {
    const fetchShops = async () => {
      setLoadingShops(true);
      try {
        const res = await axios.get("/api/manager/getShops");
        const data: Shop[] = res.data;
        setShops(data);
        if (data.length > 0) {
          const matchedShop = data.find((s: Shop) => s.id === shopId);
          const shopToSet = matchedShop ?? data[0];
          setSelectedShop(shopToSet);
          if (shopId !== shopToSet.id) {
            setShopId(shopToSet.id);
          }
        }
      } catch (error) {
        console.error("Error fetching shops:", error);
        toast.error("Failed to fetch shops.");
      } finally {
        setLoadingShops(false);
      }
    };
    fetchShops();
  }, [setShopId, shopId]);

  // --- 3. Robust handleTranslate function ---
  const handleTranslate = () => {
    if (!isInitialized) return;
    const findElementWithRetry = (callback: (element: HTMLSelectElement | null) => void) => {
        let element = document.querySelector(".goog-te-combo") as HTMLSelectElement | null;
        if (element) {
            callback(element);
            return;
        }
        setTimeout(() => {
            element = document.querySelector(".goog-te-combo") as HTMLSelectElement | null;
            callback(element);
        }, 200);
    };

    findElementWithRetry((translateSelect) => {
        if (!translateSelect) {
            toast.error("Translate feature failed to load.");
            return;
        }
        translateSelect.value = isTranslated ? "en" : "te";
        if (isTranslated) {
            document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        }
        translateSelect.dispatchEvent(new Event("change"));
        toggleTranslation();
    });
  };

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await axios.post("/api/auth/logout");
      toast.success("Logged out successfully");
      router.push("/");
      router.refresh();
    } catch (error) {
      if(isAxiosError(error)) {
        toast.error(error.response?.data?.error || "Logout failed. Try again!");
      }
    } finally {
      setLogoutLoading(false);
      setProfileAnchorEl(null);
    }
  };

  const handleShopMenuOpen = (event: React.MouseEvent<HTMLDivElement>) => setShopAnchorEl(event.currentTarget);
  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => setProfileAnchorEl(event.currentTarget);
  const handleShopSelect = (shop: Shop) => {
    setSelectedShop(shop);
    setShopId(shop.id);
    setShopAnchorEl(null);
  };

  const menuItems = [
    { text: "Inventory Management", path: "/manager/inventory" },
    { text: "Orders", path: "/manager/orders" },
    { text: "Deliveries", path: "/manager/deliveries" },
    { text: "Employee Management", path: "/manager/employeeManagement" },
  ];

  if (loadingShops) {
    return <div>Loading Manager Panel...</div>;
  }

  return (
    <>
      <AppBar position="static" elevation={3} sx={{ backgroundColor: "#91C99D", padding: "0.5rem", borderRadius: "15px" }}>
        <Toolbar sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
          <IconButton onClick={() => setMenuOpen(true)} sx={{ color: "black" }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h5" sx={{ fontWeight: "bold", color: "black", cursor: "pointer" }} onClick={() => router.push("/")}>
            ShopSync
          </Typography>
          <div style={{ display: "flex", alignItems: "center", cursor: "pointer" }} onClick={handleShopMenuOpen}>
            <Typography variant="h6" sx={{ fontWeight: "bold", color: "black", padding: "0.5rem 1rem", borderRadius: "10px" }}>
              {selectedShop ? `Welcome to ${selectedShop.name}` : "Select a Shop"}
            </Typography>
          </div>
          <Menu anchorEl={shopAnchorEl} open={Boolean(shopAnchorEl)} onClose={() => setShopAnchorEl(null)}>
            {shops.map((shop) => (
              <MenuItem key={shop.id} onClick={() => handleShopSelect(shop)}>
                {shop.name}
              </MenuItem>
            ))}
          </Menu>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <IconButton onClick={handleTranslate} disabled={!isInitialized} sx={{ color: isTranslated ? "green" : "black" }}>
              <TranslateIcon />
            </IconButton>
            <IconButton onClick={handleProfileMenuOpen}>
              <Avatar sx={{ bgcolor: "grey", color: "white", fontWeight: "bold" }} />
            </IconButton>
          </div>
        </Toolbar>
        <div id="google_translate_element" style={{ display: "none" }}></div>
      </AppBar>
      <Menu anchorEl={profileAnchorEl} open={Boolean(profileAnchorEl)} onClose={() => setProfileAnchorEl(null)}>
        <MenuItem onClick={() => router.push('/manager/profile')}>
            <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Profile</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout} disabled={logoutLoading}>
            <ListItemIcon>
                {logoutLoading ? <CircularProgress size={20} /> : <LogoutIcon fontSize="small" />}
            </ListItemIcon>
            <ListItemText>{logoutLoading ? 'Logging out...' : 'Logout'}</ListItemText>
        </MenuItem>
      </Menu>
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
                  "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.6)" },
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