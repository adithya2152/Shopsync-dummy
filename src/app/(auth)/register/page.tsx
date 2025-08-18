"use client";

import { useState } from "react";
import toast , {Toaster} from "react-hot-toast";
import axios, { isAxiosError } from "axios";
import { useRouter } from "next/navigation";
import bcrypt from "bcryptjs";
import "@/styles/login.css";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material";
import Nav from "@/components/Nav";

export default function Register() {
const [credentials, setCredentials] = useState({
username: "",
email: "",
password: "",
confPassword: "",
});

const [loading, setLoading] = useState(false);
const [otp, setOtp] = useState("");
const [isOtpSent, setIsOtpSent] = useState(false);
const [isOtpVerified, setIsOtpVerified] = useState(false);
const [genotp, setgenotp] = useState("");
const [openDialog, setOpenDialog] = useState(false);
const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
const router = useRouter();

const [searchQuery, setSearchQuery] = useState("");
const [searchResults, setSearchResults] = useState<{ name: string; lat: string; lon: string }[]>([]);
const [showResults, setShowResults] = useState(false);

// ✅ Search Location using OpenStreetMap API
const handleSearchLocation = async (query: string) => {
    if (!query.trim()) {
        setSearchResults([]);
        setShowResults(false);
        return;
    }

    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`
        );
        const data = await res.json();

        const formattedResults = data.map((place: { display_name: string; lat: string; lon: string }) => ({
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

// ✅ Select Address from Dropdown
const handleSelectAddress = (location: { name: string; lat: string; lon: string }) => {
    setLocation({ latitude: parseFloat(location.lat), longitude: parseFloat(location.lon) });
    setSearchQuery(location.name);
    setShowResults(false);
    toast.success("Address Selected");
};


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

const handleVerify = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setLoading(true);

    if (!validateEmail(credentials.email)) {
        toast.error("Invalid Email");
        setLoading(false);
        return;
    }

    const { otp } = await genOtp();
    try {
        const res = await axios.post("/api/sendmail", {
            email: credentials.email,
            otp: otp,
        });

        if (res.status === 200) {
            setIsOtpSent(true);
            toast.success("Otp sent successfully");
        } else {
            throw new Error(res.data.error || "Unknown error");
        }
    } catch (error) {
        console.log(error);
        toast.error("Failed to send mail");
    } finally {
        setLoading(false);
    }
};

const handleVerifyOtp = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const match = await bcrypt.compare(otp, genotp);

    if (match) {
        toast.success("Verified Otp successfully");
        setIsOtpVerified(true);
    } else {
        toast.error("Invalid Otp");
    }
};

const handleRegister = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setLoading(true);
    if (!validateEmail(credentials.email)) {
        toast.error("Invalid Email");
        setLoading(false);
        return;
    }
    if(credentials.password !== credentials.confPassword){
        toast.error("Passwords do not match");
        setLoading(false);
        return;
    }
    setOpenDialog(false);


    try {
        const res = await axios.post("/api/auth/register", {
            username: credentials.username,
            email: credentials.email,
            password: credentials.password,
            lat: location?.latitude,
            long: location?.longitude,
            role:"customer"
        }, {
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (res.status === 201) {
            toast.success("User Registered successfully");
            router.push("/");
        } else {
            
            throw new Error(res.data.error.message|| "Unknown error");
        }
    } catch (error) {
    if(isAxiosError(error)) {
           console.error("Registration error:", error);

    const errorMessage =
        error.response?.data?.error || // Supabase or backend error
        error.message ||               // Fallback generic message
        "Something went wrong";

    toast.error(`Failed to Register: ${errorMessage}`);
        }
}
 finally {
        setLoading(false);
        setOpenDialog(false);
    }
    // alert("Registered Successfully");
};

const handleOpenDialog = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setOpenDialog(true);
};

const handleSelectLocation = () => {
    navigator.geolocation.getCurrentPosition(
        (position) => {
            setLocation({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
            });
            console.log(position.coords.latitude, position.coords.longitude);
            toast.success("Location Selected");
        },
        (error) => {
            toast.error("Failed to fetch location");
            console.log(error);
        }
    );
};

const isRegisterDisabled = !(
    credentials.username && 
    isOtpVerified &&
    credentials.password &&
    credentials.confPassword
);

return (
    <div>
        <Nav navType="landing" />

        <div className="login">
            <div className="login-container">
                <h1>Register</h1>
                {loading && <div> Loading ..... </div>}
                <form className="login-form">   
                    <label htmlFor="username">Username</label>
                    <input type="text" name="username" placeholder="Enter your username" value={credentials.username} onChange={(e)=>setCredentials({...credentials, username: e.target.value})}  required/>

                    <label htmlFor="email">Email</label>
                    <div className="email">
                        <input type="text" name="email" placeholder="Enter your email" value={credentials.email} onChange={(e)=>setCredentials({...credentials, email: e.target.value})} required />
                        <button onClick={handleVerify}>{isOtpSent ? "Resend Otp" : "Send Otp"}</button>
                    </div>
                    {isOtpSent && (
                        <div className="otp">
                            <input type="text" name="otp" placeholder="Enter Otp" value={otp} onChange={(e)=>setOtp(e.target.value)} required />
                            <button onClick={handleVerifyOtp}>Verify Otp</button>
                        </div>
                    )}
                    {isOtpVerified && (
                        <>
                            <label htmlFor="password">Password</label>
                            <input type="password" name="password" placeholder="Enter your password" value={credentials.password} onChange={(e)=>setCredentials({...credentials, password: e.target.value})} required />
                            <label htmlFor="confPassword">Confirm Password</label>
                            <input type="password" name="confPassword" placeholder="Confirm your password" value={credentials.confPassword} onChange={(e)=>setCredentials({...credentials, confPassword: e.target.value})} required />
                        </>
                    )}
                    <button onClick={handleOpenDialog} disabled={isRegisterDisabled}>Register</button>
                    <button
                        type="button"
                        onClick={() => {setLoading(true); router.push("/api/auth/login/google")}}
                        >
                        {loading ? "Signing in..." : "Sign up with Google"}
                    </button>
                    <p>Already have Account? <a href="/login">Signup</a></p>
                </form>
                <Toaster />
            </div>
            <Dialog
                    className="location-dialog"
                    open={openDialog}
                    onClose={() => setOpenDialog(false)}
                    BackdropProps={{
                        style: {
                            backdropFilter: "blur(10px)",
                            backgroundColor: "rgba(0, 0, 0, 0.2)",
                        },
                    }}
                    style={{ zIndex: 1300 }} // Ensure dialog is above all content
                >
                    <DialogTitle>Select Home Location</DialogTitle>
                    <DialogContent>
                        <div className="location-options">
                            <div className="search-box">
                                <input
                                    type="text"
                                    placeholder="Search for an address..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        handleSearchLocation(e.target.value);
                                    }}
                                />
                                {showResults && (
                                    <ul className="location-dropdown">
                                        {searchResults.map((loc, index) => (
                                            <li key={index} onClick={() => handleSelectAddress(loc)}>
                                                {loc.name}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            <button className="current-location-btn" onClick={handleSelectLocation}>
                                📍 Use Current Location
                            </button>
                        </div>
                    </DialogContent>
                    <DialogActions className="dialog-actions">
                        <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                        <Button onClick={handleRegister}>Skip</Button>
                        <Button onClick={handleRegister} disabled={!location}>
                            Confirm
                        </Button>
                    </DialogActions>
                </Dialog>
        </div>
    </div>
);
}
 