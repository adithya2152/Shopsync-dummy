"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function ToastHandler() {
    const searchParams = useSearchParams();
    const errorMessage = searchParams.get("error");
    const message = searchParams.get("message"); // ✅ Fetch 'message' param

    useEffect(() => {
        if (errorMessage) {
            toast.error(errorMessage);
        }
        if (message) {
            toast.success(message); // ✅ Show success/info messages
        }
    }, [errorMessage, message]);

    return <ToastContainer position="top-right" autoClose={3000} />;
}
