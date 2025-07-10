import { NextRequest, NextResponse } from "next/server";
import { supabase, admin_supabase } from "./util/supabase";
import { useAuthStore } from "./store/useAuthStore";

export async function middleware(req: NextRequest) {
    const userCookie = req.cookies.get("user")?.value;
    const role = req.cookies.get("role")?.value;
    const currPath = req.nextUrl.pathname;

    console.log("🔹 User Cookie:", userCookie);
    console.log("🔹 Role:", role);
    console.log("🔹 Current Path:", currPath);


    const { role: roleFromStore, setRole } = useAuthStore.getState(); // Get Zustand role

    // ✅ Sync Zustand role with Cookie
    if (role && role !== roleFromStore) {
        console.log(`🔄 Updating Zustand Store Role: ${roleFromStore} → ${role}`);
        setRole(role);
    }

    const publicRoutes = ["/images/google.png",
        "/login", "/register", "/register-shop",
        "/employee_login/manager", "/employee_login/productHead",
        "/employee_login/delivery_assistant", "/restricted","/offline",
        "/api/get_shops", "/api/get_user", "/api/auth/is_auth",
    ];

    // ✅ If on "/" and logged in, redirect to respective home page
    if (currPath === "/") {
        if (userCookie && role) {
            const roleRedirects: Record<string, string> = {
                manager: "/manager/home",
                producthead: "/producthead/home",
                deliveryassistant: "/deliveryassistant/home"
            };

            if (roleRedirects[role]) {
                console.log(`🔄 Redirecting to ${roleRedirects[role]}`);
                return NextResponse.redirect(new URL(roleRedirects[role], req.url));
            }
        }
        console.log("✅ Staying on public '/' route.");
        return NextResponse.next();
    }

    // ✅ Allow Public Routes Without Authentication
    if (publicRoutes.includes(currPath)) {
        console.log("✅ Public Route accessed");
        return NextResponse.next();
    }

    // ✅ Redirect if User Not Logged In
    if (!userCookie) {
        console.log("❌ User not logged in. Redirecting...");
        return NextResponse.redirect(new URL("/login?error=Please log in", req.url));
    }

    try {
        const user = JSON.parse(userCookie);
        console.log("✅ Parsed User:", user);

        if (!user) {
            return NextResponse.redirect(new URL("/login?error=Invalid user session", req.url));
        }

        // ✅ Verify User in Supabase Auth
        const { data: authuser, error: authError } = await admin_supabase.auth.admin.getUserById(user.id);

        if (authError || !authuser) {
            console.log("❌ Authentication failed or Network issue Please check your internet" , authError);
            //clear cookies 

            const { error: cookieError } = await supabase.auth.signOut();

            req.cookies.delete("user");
            req.cookies.delete("role");
            
            console.log("❌ Cookies cleared:")
            if (cookieError) {
                console.error("❌ Error clearing cookies:", cookieError);
            } else {
                console.log("✅ Cookies cleared successfully");
            }
            return NextResponse.redirect(new URL("/login?error=Authentication failed", req.url));
        }

        // ✅ Check User Role in `ShopSync_Users`
        const { data: userData, error: userError } = await supabase
            .from("ShopSync_Users")
            .select("*")
            .eq("authid", user.id)
            .single();

        if (!userData || userError) {
            console.log("❌ User not found in ShopSync_Users" , userError , userData);
            return NextResponse.redirect(new URL("/restricted?error=User not found", req.url));
        }

        console.log("✅ Verified User in ShopSync_Users:", userData);

        // ✅ Role-Based Access Control for Protected Routes
        const basePath = `/${currPath.split("/")[1]}`;
        const roleMap: Record<string, string> = {
            "/manager": "manager",
            "/producthead": "producthead",
            "/deliveryassistant": "deliveryassistant",
            "/customer": "customer"
        };

        if (roleMap[basePath] && userData.role !== roleMap[basePath]) {
            console.log(`❌ Unauthorized access. Expected role: ${roleMap[basePath]}, Found: ${userData.role}`);
            return NextResponse.redirect(new URL("/restricted?error=Access Denied", req.url));
        }

        // ✅ Ensure Managers, Product Heads, and Delivery Assistants Are Assigned to a Shop
        if (["manager", "producthead", "deliveryassistant"].includes(userData.role) && !userData.homeLoc) {
            console.log("❌ User role requires a shop assignment but none found.");
            return NextResponse.redirect(new URL("/restricted?error=No shop assigned", req.url));
        }

        return NextResponse.next();
    } catch (error) {
        console.error("❌ Error in Middleware:", error);
        return NextResponse.redirect(new URL("/login?error=Unexpected error occurred", req.url));
    }
}

export const config = {
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico).*)",
    ],
};
