import { NextRequest, NextResponse } from "next/server";
import { supabase, admin_supabase } from "./util/supabase";
import { useAuthStore } from "./store/useAuthStore";

export async function middleware(req: NextRequest) {
    const userCookie = req.cookies.get("user")?.value;
    const role = req.cookies.get("role")?.value;
    const currPath = req.nextUrl.pathname;

    console.log("🔹 User Cookie:", userCookie ? "Present" : "Absent");
    console.log("🔹 Role Cookie:", role);
    console.log("🔹 Current Path:", currPath);

    // This part runs on the server, so Zustand interactions are for server-side state if needed.
    // Note: Client-side Zustand store will sync separately when the app hydrates.
    const { role: roleFromStore, setRole } = useAuthStore.getState();

    // Sync server-side Zustand state with the role from the cookie if they differ.
    if (role && role !== roleFromStore) {
        console.log(`🔄 Syncing server-side Zustand Store Role: ${roleFromStore} → ${role}`);
        setRole(role);
    }

    // --- Public Route Definitions ---
    // Specific public pages and API endpoints
    const publicRoutes = [
        "/login", "/register", "/register-shop","/employee_login",
        "/employee_login/manager", "/employee_login/productHead",
        "/employee_login/delivery_assistant", "/restricted", "/offline",
        // Specific public API routes
        "/api/sendmail",
        "/api/get_categories",
        "/api/get_shops",
        "/api/get_user",
        "/api/auth/is_auth",
        "/api/products",
        "/api/get_categ_pdts",
        "/api/auth/login",
        "/api/auth/login/google",
        "/api/auth/callback",
        "/api/auth/complete_login",
        "/api/reverseGeocode",
        "/api/geocode",
        
    ];

    // --- Public Route Handling ---

    // 1. Check for wildcard public routes (/shop/*, /category/*)
    if (currPath.startsWith('/shop/') || currPath.startsWith('/category/')) {
        console.log(`✅ Allowing public access to wildcard route: ${currPath}`);
        return NextResponse.next();
    }

    // 2. Check for exact-match public routes
    if (publicRoutes.includes(currPath)) {
        console.log(`✅ Allowing public access to exact-match route: ${currPath}`);
        return NextResponse.next();
    }

    // --- Root Path Redirection ---
    if (currPath === "/") {
        if (userCookie && role) {
            const roleRedirects: Record<string, string> = {
                manager: "/manager/home",
                producthead: "/producthead/home",
                deliveryassistant: "/deliveryassistant/home", 
            };

            const redirectUrl = roleRedirects[role];
            if (redirectUrl) {
                console.log(`↪️ User is logged in. Redirecting from '/' to ${redirectUrl}`);
                return NextResponse.redirect(new URL(redirectUrl, req.url));
            }
        }
        // If not logged in or no specific role home, treat "/" as a public page
        console.log("✅ Allowing public access to '/' for anonymous user.");
        return NextResponse.next();
    }

    // --- Protected Route Logic ---

    // If no user cookie is found for a protected route, redirect to login
    if (!userCookie) {
        console.log(`❌ No user cookie found for protected route '${currPath}'. Redirecting to login.`);
        return NextResponse.redirect(new URL("/login?error=Please log in to continue", req.url));
    }

    try {
        const user = JSON.parse(userCookie);
        if (!user || !user.id) {
            console.log("❌ Invalid user cookie format. Redirecting to login.");
            return NextResponse.redirect(new URL("/login?error=Invalid user session", req.url));
        }

        console.log("✅ Parsed User from cookie:", { id: user.id, email: user.email });

        // Verify user session with Supabase Auth
        const { data: authData, error: authError } = await admin_supabase.auth.admin.getUserById(user.id);

        if (authError || !authData.user) {
            console.error("❌ Supabase auth verification failed. Clearing cookies and redirecting.", authError);
            
            // Create a response to redirect and clear cookies
            const response = NextResponse.redirect(new URL("/login?error=Authentication failed. Please log in again.", req.url));
            response.cookies.delete("user");
            response.cookies.delete("role");

            return response;
        }

        console.log("✅ User session verified with Supabase Auth.");

        // Fetch user role and details from the custom user table
        const { data: userData, error: userError } = await supabase
            .from("ShopSync_Users")
            .select("role, homeLoc")
            .eq("authid", user.id)
            .single();

        if (userError || !userData) {
            console.error("❌ User not found in 'ShopSync_Users' table.", userError);
            return NextResponse.redirect(new URL("/restricted?error=User profile not found.", req.url));
        }

        console.log("✅ Fetched user details from DB:", userData);

        // --- Role-Based Access Control (RBAC) ---
        const basePath = `/${currPath.split("/")[1]}`; // e.g., "/manager", "/customer"
        const roleMap: Record<string, string> = {
            "/manager": "manager",
            "/producthead": "producthead",
            "/deliveryassistant": "deliveryassistant"
        };

        const expectedRole = roleMap[basePath];
        if (expectedRole && userData.role !== expectedRole) {
            console.log(`🚫 Unauthorized access attempt. Path requires role '${expectedRole}', but user has role '${userData.role}'.`);
            return NextResponse.redirect(new URL("/restricted?error=Access Denied", req.url));
        }

        // Ensure employees are assigned to a shop
        if (["manager", "producthead", "deliveryassistant"].includes(userData.role) && !userData.homeLoc) {
            console.log("❌ Employee role requires a shop assignment, but none is set.");
            return NextResponse.redirect(new URL("/restricted?error=Your account is not assigned to a shop.", req.url));
        }

        console.log(`👍 Access granted to '${currPath}' for user with role '${userData.role}'.`);
        return NextResponse.next();

    } catch (error) {
        console.error(" Middleware Error:", error);
        // Create a response to redirect and clear potentially corrupted cookies
        const response = NextResponse.redirect(new URL("/login?error=An unexpected error occurred. Please try again.", req.url));
        response.cookies.delete("user");
        response.cookies.delete("role");
        return response;
    }
}

// Apply the middleware to all routes except for static assets and images.
export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico).*)",
    ],
};
