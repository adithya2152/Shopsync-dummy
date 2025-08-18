"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/util/supabase";  
import toast, { Toaster } from "react-hot-toast";
import "@/styles/login.css";
import Nav from "@/components/Nav";
import { redirect } from "next/navigation";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [waitingForReset, setWaitingForReset] = useState(false);
  const [passwordRecovery, setPasswordRecovery] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Handle password recovery redirection
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "PASSWORD_RECOVERY") {
        setWaitingForReset(false);
        setPasswordRecovery(true);
      }
    });


    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Handle sending reset email
  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast.error("Failed to send reset email");
      console.error(error);
    } else {
      toast.success("Password reset email sent!");
      setWaitingForReset(true);
    }
  };

  // Handle new password submission
  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setUpdatingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      toast.error("Failed to update password");
    } else {
      toast.success("Password updated successfully!");
      setPasswordRecovery(false);
      redirect("/");
    }
    setUpdatingPassword(false);
  };

  return (
    <>
    <Nav navType="landing" />
    
    <div className="login">
      <div className="login-container">
        <h1>Reset Password</h1>
        <Toaster />
        
        {!waitingForReset && !passwordRecovery && (
          <form className="login-form" onSubmit={handleResetRequest}>
            <label htmlFor="email">Enter your email</label>
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit">Send Reset Email</button>
          </form>
        )}

        {waitingForReset && (
          <div className="login-form">
            <p>✅ Reset email sent. Please check your inbox.</p>
            <p>Waiting for confirmation...</p>
          </div>
        )}

        {passwordRecovery && (
          <form className="login-form" onSubmit={handlePasswordUpdate}>
            <label>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password"
              required
            />

            <label>Re-enter Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              required
            />

            <button type="submit" disabled={updatingPassword}>
              {updatingPassword ? "Updating..." : "Update Password"}
            </button>
          </form>
        )}
      </div>
    </div>
    </>
  );
}
