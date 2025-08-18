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

    const { role: roleFromStore, setRole } = useAuthStore.getState();

    if (role && role !== roleFromStore) {
        console.log(`🔄 Syncing server-side Zustand Store Role: ${roleFromStore} → ${role}`);
        setRole(role);
    }

    // --- Public Route Definitions ---
    const publicRoutes = [
        "/login", "/register", "/reset-password", "/register-shop","/employee_login",
        "/employee_login/manager", "/employee_login/productHead","/employee_login/superAdmin",
        "/employee_login/delivery_assistant", "/restricted", "/offline", "/sw-custom.js",
        "/api/sendmail", "/api/get_categories", "/api/get_shops",
        "/api/get_user", "/api/auth/is_auth", "/api/products","/api/auth/register",
        "/api/get_categ_pdts", "/api/auth/login", "/api/auth/login/google",
        "/api/auth/callback", "/api/auth/complete_login",
        "/api/reverseGeocode", "/api/geocode","/api/coupons",
        "/manifest.json"
    ];

    if (currPath.startsWith('/shop/') || currPath.startsWith('/category/') || currPath.startsWith('/search/')) {
        console.log(`✅ Allowing public access to wildcard route: ${currPath}`);
        return NextResponse.next();
    }

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
                superAdmin: "/superAdmin/home",
            };
            const redirectUrl = roleRedirects[role];
            if (redirectUrl) {
                console.log(`↪️ User is logged in. Redirecting from '/' to ${redirectUrl}`);
                return NextResponse.redirect(new URL(redirectUrl, req.url));
            }
        }
        console.log("✅ Allowing public access to '/' for anonymous user.");
        return NextResponse.next();
    }

    // --- Protected Route Logic ---
    if (!userCookie) {
        console.log(`❌ No user cookie for protected route '${currPath}'. Redirecting to login.`);
        return NextResponse.redirect(new URL("/login?error=Please log in to continue", req.url));
    }

    try {
        const user = JSON.parse(userCookie);
        if (!user || !user.id) {
            console.log("❌ Invalid user cookie format. Redirecting to login.");
            return NextResponse.redirect(new URL("/login?error=Invalid user session", req.url));
        }

        const { data: authData, error: authError } = await admin_supabase.auth.admin.getUserById(user.id);
        if (authError || !authData.user) {
            console.error("❌ Supabase auth verification failed. Clearing cookies and redirecting.", authError);
            const response = NextResponse.redirect(new URL("/login?error=Authentication failed. Please log in again.", req.url));
            response.cookies.delete("user");
            response.cookies.delete("role");
            return response;
        }

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
        const userRole = userData.role as string;

        // --- Role-Based Access Control (RBAC) ---
        const basePath = `/${currPath.split("/")[1]}`;
        const roleMap: Record<string, string> = {
            "/manager": "manager",
            "/producthead": "producthead",
            "/deliveryassistant": "deliveryassistant",
            "/superAdmin": "superAdmin"
        };
        const expectedRole = roleMap[basePath];
        if (expectedRole && userRole !== expectedRole) {
            console.log(`🚫 Unauthorized access attempt. Path requires role '${expectedRole}', but user has role '${userRole}'.`);
            return NextResponse.redirect(new URL("/restricted?error=Access Denied", req.url));
        }
        
        // =================================================================================
        // --- TEMPLATE: Page-Level Role-Based Access Control ---
        // =================================================================================
        // Define specific pages that roles are NOT allowed to access.
        // The 'superAdmin' can access everything, so they don't need an entry.
        // const pageAccessRules: Record<string, string[]> = {
        //     customer: [
                
        //     ],
        //     manager: [
        //         // Example: A manager cannot access the super admin's settings page
        //         '/manager/system-settings', 
        //         // ADD MORE MANAGER-RESTRICTED ROUTES HERE
        //     ],
        //     producthead: [
        //         // Example: A product head cannot view financial reports
        //         '/producthead/financial-overview',
        //         // ADD MORE PRODUCTHEAD-RESTRICTED ROUTES HERE
        //     ],
        //     deliveryassistant: [
        //         // Example: A delivery assistant cannot view order analytics
        //         '/deliveryassistant/analytics',
        //         // ADD MORE DELIVERYASSISTANT-RESTRICTED ROUTES HERE
        //     ],
        //     superAdmin: []
        // };

        // const disallowedRoutesForRole = pageAccessRules[userRole] || [];
        // if (disallowedRoutesForRole.includes(currPath)) {
        //     console.log(`🚫 Page-level restriction. Role '${userRole}' is not allowed to access '${currPath}'.`);
        //     return NextResponse.redirect(new URL("/restricted?error=You do not have permission to view this page.", req.url));
        // }
        // // =================================================================================


        // --- Final Checks ---
        if (["manager", "producthead", "deliveryassistant"].includes(userRole) && !userData.homeLoc) {
            console.log("❌ Employee role requires a shop assignment, but none is set.");
            return NextResponse.redirect(new URL("/restricted?error=Your account is not assigned to a shop.", req.url));
        }

        console.log(`👍 Access granted to '${currPath}' for user with role '${userRole}'.`);
        return NextResponse.next();

    } catch (error) {
        console.error(" Middleware Error:", error);
        const response = NextResponse.redirect(new URL("/login?error=An unexpected error occurred. Please try again.", req.url));
        response.cookies.delete("user");
        response.cookies.delete("role");
        return response;
    }
}

export const config = {
    matcher: [
        // "/((?!_next/static|_next/image|favicon.ico).*)",
        '/((?!_next/static|_next/image|favicon.ico|icons/|images/).*)'
    ],
};
