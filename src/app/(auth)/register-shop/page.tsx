"use client";

import { useState } from "react";
import "../../../styles/shop-register.css";
import toast, { Toaster } from "react-hot-toast";
import axios from "axios";
import bcrypt from "bcryptjs";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";

// ✅ Define Type for Location Data from OpenStreetMap API
type LocationResult = {
  name: string;
  lat: string;
  lon: string;
};

// ✅ Define API Response Type
type NominatimResponse = {
  display_name: string;
  lat: string;
  lon: string;
};

export default function ShopRegister() {
  const [shopDetails, setShopDetails] = useState({
    shopName: "",
    lat: "",
    long: "",
    address: "",
  });

  const [managerDetails, setManagerDetails] = useState({
    managerName: "",
    managerEmail: "",
    lat: "",
    long: "",
    address: "",
    managerPassword: "",
    confPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<LocationResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const router = useRouter();
  // OTP State
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [genotp, setgenotp] = useState("");

  // ✅ Fetch Location using OpenStreetMap API with Axios
  const handleSearchLocation = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    try {
      const res = await axios.get<NominatimResponse[]>(
        `https://nominatim.openstreetmap.org/search`,
        {
          params: {
            q: query,
            format: "json",
            limit: 5,
          },
        }
      );

      const formattedResults: LocationResult[] = res.data.map((place) => ({
        name: place.display_name,
        lat: place.lat,
        lon: place.lon,
      }));

      setSearchResults(formattedResults);
      setShowResults(formattedResults.length > 0);
    } catch (error) {
      console.error("❌ Location Search Error:", error);
      setSearchResults([]);
      setShowResults(false);
    }
  };

  // ✅ Fetch User's Current Location
  const handleUseCurrentLocation = (type: string) => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
  
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
  
        if (type === "shop") {
          setShopDetails((prev) => ({
            ...prev,
            lat: latitude.toString(),
            long: longitude.toString(),
          }));
        } else {
          setManagerDetails((prev) => ({
            ...prev,
            lat: latitude.toString(),
            long: longitude.toString(),
          }));
        }
  
        try {
          const res = await axios.get(
            `https://nominatim.openstreetmap.org/reverse`,
            {
              params: {
                lat: latitude,
                lon: longitude,
                format: "json",
              },
            }
          );
  
          if (type === "shop") {
            setShopDetails((prev) => ({
              ...prev,
              address: res.data.display_name,
            }));
          } else {
            setManagerDetails((prev) => ({
              ...prev,
              address: res.data.display_name,
            }));
          }
        } catch (error) {
          console.error("❌ Reverse Geocoding Error:", error);
        }
      },
      (error) => {
        alert("Failed to get location. Please enable location services.");
        console.error("Geolocation Error:", error);
      }
    );
  };
  

  // ✅ Email OTP Verification
  function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  const genOtp = async () => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hash = await bcrypt.hash(otp, 10);
    setgenotp(hash);
    return { otp, hash };
  };

  const handleSendOtp = async () => {
    setLoading(true);

    if (!validateEmail(managerDetails.managerEmail)) {
      toast.error("Invalid Email");
      return;
    }

    const { otp } = await genOtp();
    try {
      const res = await axios.post("/api/sendmail", {
        email: managerDetails.managerEmail,
        otp: otp,
      });

      if (res.status === 200) {
        setIsOtpSent(true);
        toast.success("OTP sent successfully!");
      } else {
        throw new Error(res.data.error || "Unknown error");
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const match = await bcrypt.compare(otp, genotp);
    if (match) {
      toast.success("OTP verified successfully!");
      setIsOtpVerified(true);
    } else {
      toast.error("Invalid OTP");
    }
  };

  // ✅ Handle Form Submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    if (managerDetails.managerPassword !== managerDetails.confPassword) {
      toast.error("Passwords do not match!");
      setLoading(false);
      return;
    }

    console.log("📌 Registering Shop:", shopDetails);
    console.log("📌 Manager Details:", managerDetails);

    try {
      const res = await axios.post(
        "/api/auth/shop-register",
        {
          shopName: shopDetails.shopName,
          lat: shopDetails.lat,
          long: shopDetails.long,
          address: shopDetails.address,
          managerName: managerDetails.managerName,
          mlat:managerDetails.lat,
          mlong:managerDetails.long,
          managerAddress: managerDetails.address,
          managerEmail: managerDetails.managerEmail,
          managerPassword: managerDetails.managerPassword,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (res.status === 200) {
        toast.success("Shop registered successfully!");
        router.push(`/manager/home?message=welcome to SHOP ${shopDetails.shopName}?shop=${shopDetails.shopName}`);
      } else {
        throw new Error(res.data.error || "Unknown error");
      }
    } catch (error) {
      console.log(error);
      toast.error(`Failed to Register Shop, ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Nav navType="landing" />
      <div className="shop-register">
        <h1>Register Your Shop</h1>
        {loading && <div className="loader">Loading ... </div>}

        <form onSubmit={handleSubmit}>
          {/* 📌 Shop Details */}
          <label>Shop Name</label>
          <input
            type="text"
            placeholder="Enter shop name"
            value={shopDetails.shopName}
            onChange={(e) =>
              setShopDetails({ ...shopDetails, shopName: e.target.value })
            }
            required
          />

          <label>Shop Location</label>
          <input
            type="text"
            placeholder="Search for a location..."
            value={shopDetails.address}
            onChange={(e) => {
              setShopDetails({ ...shopDetails, address: e.target.value });
              handleSearchLocation(e.target.value);
            }}
            required
          />

          {showResults && (
            <ul className="location-dropdown">
              {searchResults.map((loc, index) => (
                <li
                  key={index}
                  onClick={() =>
                    setShopDetails({
                      ...shopDetails,
                      lat: loc.lat,
                      long: loc.lon,
                      address: loc.name,
                    })
                  }
                >
                  {loc.name}
                </li>
              ))}
            </ul>
          )}

          <button type="button" onClick={()=>handleUseCurrentLocation("shop")}>
            Use Current Location 📍
          </button>

          {/* 📌 Manager Details */}
          <h1>Manager Details</h1>

          

          <label>Manager home Location </label>
          <input
            type="text"
            placeholder="Search for a location..."
            value={managerDetails.address}
            onChange={(e) => {
              setManagerDetails({ ...managerDetails, address: e.target.value });
              handleSearchLocation(e.target.value);
            }}
            required
          />

          {showResults && (
            <ul className="location-dropdown">
              {searchResults.map((loc, index) => (
                <li
                  key={index}
                  onClick={() =>
                    setManagerDetails({
                      ...managerDetails,
                      lat: loc.lat,
                      long: loc.lon,
                      address: loc.name,
                    })
                  }
                >
                  {loc.name}
                </li>
              ))}
            </ul>
          )}
          <button type="button" onClick={()=>handleUseCurrentLocation("manager")}>
            Use Current Location 📍
          </button>


          <label>Name</label>
          <input
            type="text"
            placeholder="Enter manager's name"
            value={managerDetails.managerName}
            onChange={(e) =>
              setManagerDetails({
                ...managerDetails,
                managerName: e.target.value,
              })
            }
            required
          />
          <label>Email</label>
          <div style={{ display: "flex", flexDirection: "row" }}>

            <input
              style={{ flex: 3, marginTop: "10px", marginRight: "10px" , marginBottom: "10px" }}
              type="email"
              placeholder="Enter email"
              value={managerDetails.managerEmail}
              onChange={(e) =>
                setManagerDetails({
                  ...managerDetails,
                  managerEmail: e.target.value,
                })
              }
              required
            />
            <button style={{flex:1}} type="button" onClick={handleSendOtp} disabled={loading}>
              {isOtpSent ? "Resend OTP" : "Send OTP"}
            </button>


          </div>
          
          {isOtpSent && (
            <>
              <label>Enter OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={loading}
              >
                Verify OTP
              </button>
            </>
          )}

          {isOtpVerified && (
            <>
              <label>Password</label>
              <input
                type="password"
                value={managerDetails.managerPassword}
                onChange={(e) =>
                  setManagerDetails({
                    ...managerDetails,
                    managerPassword: e.target.value,
                  })
                }
                required
              />
              <label>Confirm Password</label>
              <input
                type="password"
                value={managerDetails.confPassword}
                onChange={(e) =>
                  setManagerDetails({
                    ...managerDetails,
                    confPassword: e.target.value,
                  })
                }
                required
              />
            </>
          )}

          <button type="submit" disabled={!isOtpVerified || loading}>
            {loading ? "Registering..." : "Register Shop"}
          </button>
            <p style={{
                marginTop: "15px",
                fontSize: "16px",
                textAlign: "center",
                color: "#fff", // Light text for contrast
                fontWeight: "500",
              }}>
            Existing Manager? 
            <a 
                href="/employee_login/manager?message=Login to register the shop?redirect=/register_shop" 
                style={{
                    color: "#ffc107", // A warm yellow for visibility
                    textDecoration: "underline",
                    fontWeight: "bold",
                    marginLeft: "5px",
                    cursor: "pointer",
                }}
            >
                Yes
            </a>
        </p>
        </form>

        <Toaster />
      </div>
    </div>
  );
}
