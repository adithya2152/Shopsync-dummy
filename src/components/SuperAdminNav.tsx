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
import DashboardIcon from "@mui/icons-material/Dashboard";
import SettingsIcon from "@mui/icons-material/Settings";
import PeopleIcon from "@mui/icons-material/People";
import StoreIcon from "@mui/icons-material/Store";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import { useTranslationStore } from "../store/TranslationStore";
import "../styles/globals.css";
import axios, { isAxiosError } from "axios";
import { toast } from "react-hot-toast";

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

export default function SuperAdminNav() {
  const { isTranslated, isInitialized, toggleTranslation, setInitialized, setIsTranslated } = useTranslationStore();
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [profileAnchorEl, setProfileAnchorEl] = useState<null | HTMLElement>(null);

  useEffect(() => {
    if (document.querySelector('script[src*="translate.google.com"]')) {
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

  useEffect(() => {
    const translationCookie = document.cookie.includes("googtrans=/en/te");
    if (translationCookie && !isTranslated) {
      setIsTranslated(true);
    }
  }, [isTranslated, setIsTranslated]);

  const handleTranslate = () => {
    if (!isInitialized) {
        toast.error("Translation service is initializing. Please wait a moment.");
        return;
    }

    if (isTranslated) {
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    } else {
      document.cookie = 'googtrans=/en/te; path=/;';
    }
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

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => setProfileAnchorEl(event.currentTarget);

  const menuItems = [
    { text: "Dashboard", path: "/superAdmin/home", icon: <DashboardIcon /> },
    { text: "Platform Settings", path: "/superAdmin/settings", icon: <SettingsIcon /> },
    { text: "User Management", path: "/superAdmin/users", icon: <PeopleIcon /> },
    { text: "Shop Management", path: "/superAdmin/shops", icon: <StoreIcon /> },
    { text: "Analytics", path: "/superAdmin/analytics", icon: <AnalyticsIcon /> },
  ];

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
          
          <Typography variant="h6" sx={{ fontWeight: "bold", color: "black" }}>
            Super Admin Panel
          </Typography>

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
        <MenuItem onClick={() => router.push('/superAdmin/profile')}>
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
         <div style={{ width: "280px", padding: "1rem", backgroundColor: "#91C99D", height: "100%" }}>
          <Typography variant="h6" sx={{ fontWeight: "bold", color: "black", marginBottom: "1rem", marginTop: "1rem", textAlign: "center" }}>
            Super Admin Panel
          </Typography>
          <Divider sx={{ backgroundColor: "white" }} />
          <List>
            {menuItems.map(({ text, path, icon }) => (
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {icon}
                  <ListItemText primary={text} sx={{ color: "black", fontWeight: "bold" }} />
                </Box>
              </ButtonBase>
            ))}
          </List>
        </div>
      </Drawer>
    </>
  );
}