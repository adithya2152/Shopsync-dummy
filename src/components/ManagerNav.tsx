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
  const { isTranslated, isInitialized, toggleTranslation, setInitialized, setIsTranslated } = useTranslationStore();
  const { setShopId, shopId, _hasHydrated } = useShopIdStore();
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [loadingShops, setLoadingShops] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [shopAnchorEl, setShopAnchorEl] = useState<null | HTMLElement>(null);
  const [profileAnchorEl, setProfileAnchorEl] = useState<null | HTMLElement>(null);

  // --- 1. useEffect for Google Translate Script (No changes needed) ---
  useEffect(() => {
    if (document.querySelector('script[src*="translate.google.com"]')) {
      // Also check if the widget is already initialized to avoid re-running
      if (isInitialized) return;
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
  }, [setInitialized, isInitialized]);
  
  // --- 2. useEffect to Sync Translation State from Cookie (NEW) ---
  // This ensures the toggle's appearance is correct after a reload.
  useEffect(() => {
    const translationCookie = document.cookie.includes("googtrans=/en/te");
    if (translationCookie && !isTranslated) {
      setIsTranslated(true);
    }
  }, [isTranslated, setIsTranslated]);


  // --- 3. useEffect for Fetching Shops (No changes needed) ---
  useEffect(() => {
    if (!_hasHydrated) return;

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
  }, [setShopId, shopId, _hasHydrated]);


  // --- 4. Robust handleTranslate function (MODIFIED) ---
  // This is the standard way to trigger Google Translate via cookies.
  const handleTranslate = () => {
    if (!isInitialized) {
        toast.warn("Translation service is initializing. Please wait a moment.");
        return;
    };

    if (isTranslated) {
      // To revert to English, expire the cookie
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    } else {
      // To translate to Telugu, set the cookie
      document.cookie = 'googtrans=/en/te; path=/;';
    }
    // Update the state in the store and reload the page for the change to take effect
    toggleTranslation();
    window.location.reload();
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

const handleShopMenuOpen = (event: React.MouseEvent<HTMLElement>) => setShopAnchorEl(event.currentTarget);
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

  // A better loading state that doesn't block the entire nav
  const isLoading = loadingShops || !_hasHydrated;

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
          
          <ButtonBase onClick={handleShopMenuOpen} disabled={isLoading} sx={{ borderRadius: "10px", padding: "0.5rem 1rem" }}>
            {isLoading ? (
                <CircularProgress size={24} sx={{color: 'black'}} />
            ) : (
                <Typography variant="h6" sx={{ fontWeight: "bold", color: "black" }}>
                  {selectedShop ? `Welcome to ${selectedShop.name}` : "No Shop Found"}
                </Typography>
            )}
          </ButtonBase>

          <Menu anchorEl={shopAnchorEl} open={Boolean(shopAnchorEl)} onClose={() => setShopAnchorEl(null)}>
            {shops.map((shop) => (
              <MenuItem key={shop.id} onClick={() => handleShopSelect(shop)}>
                {shop.name}
              </MenuItem>
            ))}
          </Menu>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <IconButton onClick={handleTranslate} disabled={!isInitialized} sx={{ color: isTranslated ? "#1976d2" : "black" }}>
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