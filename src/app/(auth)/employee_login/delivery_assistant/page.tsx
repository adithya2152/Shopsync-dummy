"use client";

import "@/styles/login.css";
import { useState, Suspense } from "react"; // Import Suspense from React
import axios from "axios";
import { useRouter } from "next/navigation";
import dynamicImport from "next/dynamic";

// Dynamically import Nav and Toaster to prevent SSR issues
const Nav = dynamicImport(() => import("@/components/Nav"), { ssr: false });
const Toaster = dynamicImport(() => import("react-hot-toast").then((mod) => mod.Toaster), {
  ssr: false,
});

// Define the Cred interface
interface Cred {
  email: string;
  password: string;
}

// Force dynamic rendering to skip prerendering
export const dynamic = "force-dynamic";

export default function Login() {
  // Hooks must be outside any try block to comply with React Hooks rules
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState<Cred>({
    email: "",
    password: "",
  });
  const router = useRouter();

  // Handle Input Change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value,
    });
  };

  // Handle Login
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post("/api/auth/login", { credentials, role: "deliveryassistant" });

      if (res.status === 200) {
        const { toast } = await import("react-hot-toast");
        toast.success("✅ Login Successful!");
        router.push("/manager/home");
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const errorMessage = error.response?.data?.error || "Login failed. Try again!";

        const { toast } = await import("react-hot-toast");
        if (status === 400) {
          toast.error("❌ Invalid Email or Password");
        } else if (status === 403) {
          toast.error("❌ Invalid Role. Please check your account permissions.");
        } else if (status === 500) {
          toast.error("⚠️ Server Error. Please try again later.");
        } else {
          toast.error(errorMessage);
        }

        console.error("❌ Axios Login Error:", error.response?.data);
      } else {
        const { toast } = await import("react-hot-toast");
        toast.error("An unexpected error occurred!");
        console.error("❌ Unexpected Error:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  // Render logic wrapped in try-catch for error handling
  try {
    return (
      <div>
        {/* Wrap Nav in Suspense to handle useSearchParams() */}
        <Suspense fallback={<div>Loading navigation...</div>}>
          <Nav navType="landing" />
        </Suspense>
        <div className="login">
          <div className="login-container">
            <h1>Delivery Assistant Login</h1>
            <form className="login-form" onSubmit={handleLogin}>
              <label htmlFor="email">Email</label>
              <input
                type="text"
                name="email"
                placeholder="Enter your email"
                value={credentials.email}
                onChange={handleChange}
                required
              />
              <label htmlFor="password">Password</label>
              <input
                type="password"
                name="password"
                placeholder="Enter your password"
                value={credentials.password}
                onChange={handleChange}
                required
              />
              <button type="submit" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </button>
              <p>
                New User? <a href="/register">Signup</a>
              </p>
            </form>
          </div>
          <Toaster />
        </div>
      </div>
    );
  } catch (error) {
    console.error("Rendering error:", error);
    return <div>Error rendering page. Please try again.</div>;
  }
}