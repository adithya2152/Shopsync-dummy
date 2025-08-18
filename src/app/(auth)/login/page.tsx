"use client";

import "@/styles/login.css";
import { useState } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";

interface Cred {
  email: string;
  password: string;
}

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState<Cred>({
    email: "",
    password: "",
  });

  const router = useRouter();

  // ✅ Handle Input Change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value,
    });
  };

  // ✅ Handle Login
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post("/api/auth/login", { credentials, role: "customer" });

      if (res.status === 200) {
        toast.success("✅ Login Successful!");
        router.push("/");
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const errorMessage = error.response?.data?.error || "Login failed. Try again!";

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
        // ✅ Handle generic JavaScript error
        toast.error("An unexpected error occurred!");
        console.error("❌ Unexpected Error:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Nav navType="landing"/>
        <div className="login">
          <div className="login-container">
            <h1> Login</h1>
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
              <button
                type="button"
                onClick={() => {setLoading(true); router.push("/api/auth/login/google")}}
              >
                {loading ? "Logging in..." : "Login with Google"}
              </button>
              <p>
                New User? <a href="/register">Signup</a>
              </p>
              <p>
                <a href="/reset-password">Forgot password</a>
              </p>
            </form>
          </div>
          <Toaster />
        </div>
    </div>
    
  );
}
