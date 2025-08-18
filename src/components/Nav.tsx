"use client";

import { useEffect, useState, ChangeEvent } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Avatar,
  Paper,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  ListItemIcon,
  useMediaQuery, // Import useMediaQuery
} from "@mui/material";
import { useTheme, styled } from "@mui/material/styles"; // Import useTheme
import SearchIcon from "@mui/icons-material/Search";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import TranslateIcon from "@mui/icons-material/Translate";
import InputBase from "@mui/material/InputBase";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Person2Icon from "@mui/icons-material/Person2";
import HistoryIcon from "@mui/icons-material/History";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu"; // Import MenuIcon
import { useTranslationStore } from "../store/TranslationStore";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import axios from "axios";
import debounce from "lodash.debounce";
import "../styles/globals.css";

// ... (keep your global interface, styled components, and type definitions as they are) ...
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

const Search = styled("div")(({ theme }) => ({
  position: "relative",
  borderRadius: "20px",
  backgroundColor: "rgba(123, 189, 143, 0.8)",
  boxShadow: "0 0 10px rgba(255, 255, 255, 0.5)",
  display: "flex",
  alignItems: "center",
  padding: "5px 15px",
  margin: "0 auto",
  width: "100%",
  maxWidth: "400px",
  [theme.breakpoints.up("sm")]: {
    width: "auto",
  },
}));

const SearchResults = styled(Paper)(() => ({
  position: "absolute",
  top: "100%",
  left: 0,
  right: 0,
  zIndex: 10,
  maxHeight: 300,
  overflowY: "auto",
  borderRadius: "0 0 10px 10px",
}));

type NavProp = {
  navType: string;
};

type Product = {
  id: number;
  name: string;
  shopId: number;
  shopName: string;
  type: "Product";
};

type Category = {
  id: number;
  name: string;
  type: "Category";
};

type Shop = {
  id: number;
  name: string;
  type: "Shop";
};

type SearchItem = Product | Category | Shop;

export default function Nav({ navType }: NavProp) {
  const router = useRouter();
  const { isTranslated, isInitialized, toggleTranslation, setInitialized } =
    useTranslationStore();
  const [query, setQuery] = useState<string>("");
  const [results, setResults] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [profileMenuAnchorEl, setProfileMenuAnchorEl] =
    useState<null | HTMLElement>(null);
  const [mobileMenuAnchorEl, setMobileMenuAnchorEl] =
    useState<null | HTMLElement>(null);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const params = useParams<{ shopId?: string }>();

  // Hooks for responsiveness
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const isProfileMenuOpen = Boolean(profileMenuAnchorEl);
  const isMobileMenuOpen = Boolean(mobileMenuAnchorEl);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setProfileMenuAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileMenuAnchorEl(null);
  };

  const handleMobileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMobileMenuAnchorEl(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuAnchorEl(null);
  };

  // ... (keep all your functions like useEffect, handleTranslate, debouncedSearch, handleChange, handleLogout, handleSelect as they are) ...
  useEffect(() => {
    if (window.googleTranslateElementInit) return;

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
    script.src =
      "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.body.appendChild(script);
  }, [setInitialized]);

  const handleTranslate = () => {
    if (!isInitialized) return;

    const translateSelect = document.querySelector(
      ".goog-te-combo"
    ) as HTMLSelectElement | null;
    if (translateSelect) {
      translateSelect.value = isTranslated ? "en" : "te";
      translateSelect.dispatchEvent(new Event("change"));
      
    }
  };

  const debouncedSearch = debounce(async (term: string) => {
    if (!term.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    if (params.shopId) {
      // If in a shop context, restrict search to that shop
      try {
        const productsRes = await axios.get<{
          products: Omit<Product, "type">[];
        }>(`/api/search/products?q=${term}&shopId=${params.shopId}`);
        setResults(
          productsRes.data.products.map((item) => ({
            ...item,
            type: "Product" as const,
          }))
        );
      } catch (error) {
        console.error("Search error:", error);
      }
      setLoading(false);
      return;
    }
    try {
      const [productsRes, categoriesRes, shopsRes] = await Promise.all([
        axios.get<{ products: Omit<Product, "type">[] }>(
          `/api/search/products?q=${term}`
        ),
        axios.get<{ categories: Omit<Category, "type">[] }>(
          `/api/search/categories?q=${term}`
        ),
        axios.get<{ shops: Omit<Shop, "type">[] }>(
          `/api/search/shops?q=${term}`
        ),
      ]);

      const combined: SearchItem[] = [
        ...productsRes.data.products.map((item) => ({
          ...item,
          type: "Product" as const,
        })),
        ...categoriesRes.data.categories.map((item) => ({
          ...item,
          type: "Category" as const,
        })),
        ...shopsRes.data.shops.map((item) => ({
          ...item,
          type: "Shop" as const,
        })),
      ];

      setResults(combined);
    } catch (error) {
      console.error("Search error:", error);
    }

    setLoading(false);
  }, 500);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    debouncedSearch(val);
  };

  const handleLogout = async () => {
    try {
      setLogoutLoading(true);

      const response = await axios.post("/api/auth/logout");

      if (response.status === 200) {
        // Clear translation state if needed
        toggleTranslation(); // Optional: reset translation UI state
        setQuery(""); // Clear search
        setResults([]); // Clear results // Push with a hard refresh

        router.push("/?message=Logged out successfully");
        router.refresh(); // Ensures soft navigation resets the state
      } else {
        console.error("Logout failed:", response.data);
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setLogoutLoading(false);
    }
  };

  const handleSelect = (item: SearchItem) => {
    switch (item.type) {
      case "Product":
        router.push(`/shop/${item.shopId}?pdtId=${item.id}`);
        break;
      case "Category":
        router.push(`/category/${item.id}`);
        break;
      case "Shop":
        router.push(`/shops/${item.id}`);
        break;
    }
    setResults([]);
    setQuery("");
  };

  const renderMobileMenu = (
    <Menu
      anchorEl={mobileMenuAnchorEl}
      open={isMobileMenuOpen}
      onClose={handleMobileMenuClose}
    >
      {navType !== "landing" && [
        <MenuItem
          key="profile"
          onClick={() => {
            router.push("/profile");
            handleMobileMenuClose();
          }}
        >
          <ListItemIcon>
            <Person2Icon />
          </ListItemIcon>
          <ListItemText>Profile</ListItemText>
        </MenuItem>,
        <MenuItem
          key="history"
          onClick={() => {
            router.push("/history");
            handleMobileMenuClose();
          }}
        >
          <ListItemIcon>
            <HistoryIcon />
          </ListItemIcon>
          <ListItemText>My Orders</ListItemText>
        </MenuItem>,
      ]}
      {(navType === "customer" || navType === "landing") && (
        <MenuItem
          key="cart"
          onClick={() => {
            router.push("/checkout");
            handleMobileMenuClose();
          }}
        >
          <ListItemIcon>
            <ShoppingCartIcon />
          </ListItemIcon>
          <ListItemText>Cart</ListItemText>
        </MenuItem>
      )}
      <MenuItem
        key="translate"
        onClick={() => {
          handleTranslate();
          handleMobileMenuClose();
        }}
      >
        <ListItemIcon>
          <TranslateIcon color={isTranslated ? "success" : "inherit"} />
        </ListItemIcon>
        <ListItemText>Translate</ListItemText>
      </MenuItem>
      {navType === "landing" && [
        <MenuItem
          key="signin"
          onClick={() => {
            window.location.href = "/login";
          }}
        >
          <ListItemText>Signin</ListItemText>
        </MenuItem>,
        <MenuItem
          key="signup"
          onClick={() => {
            window.location.href = "/register";
          }}
        >
          <ListItemText>Signup</ListItemText>
        </MenuItem>,
      ]}
      {navType !== "landing" && (
        <MenuItem key="logout" onClick={handleLogout} disabled={logoutLoading}>
          <ListItemIcon>
            {logoutLoading ? <CircularProgress size={18} /> : <LogoutIcon />}
          </ListItemIcon>
          <ListItemText>
            {logoutLoading ? "Logging out..." : "Logout"}
          </ListItemText>
        </MenuItem>
      )}
    </Menu>
  );

  return (
    <>
      <AppBar
        position="static"
        elevation={3}
        sx={{
          backgroundColor: "#91C99D",
          padding: "0.5rem",
          borderRadius: "15px",
        }}
      >
        <Toolbar
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
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
            onClick={() => (window.location.href = "/")}
          >
            ShopSync
          </Typography>

          <div
            style={{
              flexGrow: isMobile ? 1 : 0,
              display: "flex",
              justifyContent: "center",
            }}
          >
            {(navType === "customer" || navType === "landing") && (
              <div style={{ position: "relative" }}>
                <Search>
                  <SearchIcon sx={{ color: "black" }} />
                  <InputBase
                    placeholder="Search..."
                    value={query}
                    onChange={handleChange}
                    inputProps={{ "aria-label": "search" }}
                  />
                </Search>
                {query && (
                  <SearchResults>
                    {loading ? (
                      <ListItem>
                        <CircularProgress size={20} /> &nbsp; Loading...
                      </ListItem>
                    ) : results.length === 0 ? (
                      <ListItem>
                        <ListItemText primary="No results found" />
                      </ListItem>
                    ) : (
                      <List>
                        {results.map((item, idx) => (
                          <ListItem
                            key={idx}
                            onClick={() => handleSelect(item)}
                            component="div"
                            sx={{ cursor: "pointer" }}
                          >
                            <ListItemText
                              primary={item.name}
                              secondary={
                                item.type === "Product"
                                  ? `${item.type} - ${item.shopName}`
                                  : item.type
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    )}
                  </SearchResults>
                )}
              </div>
            )}
          </div>

          {isMobile ? (
            <IconButton color="inherit" onClick={handleMobileMenuOpen}>
              <MenuIcon />
            </IconButton>
          ) : (
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              {navType === "landing" && (
                <>
                  <Button
                    onClick={() => (window.location.href = "/login")}
                    variant="contained"
                    sx={{
                      backgroundColor: "#007bff",
                      color: "white",
                      borderRadius: "15px",
                      border: "1px solid white",
                      boxShadow: "0 0 10px rgba(255, 255, 255, 0.5)",
                    }}
                  >
                    Signin
                  </Button>
                  <Button
                    onClick={() => (window.location.href = "/register")}
                    variant="outlined"
                    sx={{
                      color: "white",
                      borderRadius: "15px",
                      border: "1px solid white",
                      boxShadow: "0 0 10px rgba(255, 255, 255, 0.5)",
                    }}
                  >
                    Signup
                  </Button>
                </>
              )}
              <IconButton
                onClick={handleTranslate}
                sx={{
                  color: isTranslated ? "green" : "black",
                  boxShadow: "0 0 10px rgba(255, 255, 255, 0.5)",
                }}
              >
                <TranslateIcon />
              </IconButton>
              {(navType === "customer" || navType === "landing") && (
                <IconButton
                  href="/checkout"
                  sx={{
                    color: "black",
                    boxShadow: "0 0 10px rgba(255, 255, 255, 0.5)",
                  }}
                >
                  <ShoppingCartIcon />
                </IconButton>
              )}
              {navType !== "landing" && (
                <>
                  <IconButton onClick={handleProfileMenuOpen}>
                    <Avatar
                      sx={{
                        bgcolor: "grey",
                        color: "white",
                        fontWeight: "bold",
                      }}
                    />
                  </IconButton>
                  <Menu
                    id="profile-menu"
                    anchorEl={profileMenuAnchorEl}
                    open={isProfileMenuOpen}
                    onClose={handleProfileMenuClose}
                  >
                    <MenuItem onClick={() => router.push("/profile")}>
                      <ListItemIcon>
                        <Person2Icon />
                      </ListItemIcon>
                      <ListItemText>Profile</ListItemText>
                    </MenuItem>
                    <MenuItem onClick={() => router.push("/history")}>
                      <ListItemIcon>
                        <HistoryIcon />
                      </ListItemIcon>
                      <ListItemText>My Orders</ListItemText>
                    </MenuItem>
                    <MenuItem onClick={handleLogout} disabled={logoutLoading}>
                      <ListItemIcon>
                        {logoutLoading ? (
                          <CircularProgress size={18} />
                        ) : (
                          <LogoutIcon />
                        )}
                      </ListItemIcon>
                      <ListItemText>
                        {logoutLoading ? "Logging out..." : "Logout"}
                      </ListItemText>
                    </MenuItem>
                  </Menu>
                </>
              )}
            </div>
          )}
        </Toolbar>
        <div id="google_translate_element" style={{ display: "none" }}></div>
      </AppBar>
      {renderMobileMenu}
    </>
  );
}
