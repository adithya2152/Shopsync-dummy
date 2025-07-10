import { NextRequest, NextResponse } from "next/server";
import { supabase } from "./util/supabase";

export async function middleware(req: NextRequest) {
    const currPath = req.nextUrl.pathname;

    console.log("🔹 Current Path:", currPath);

    const publicRoutes = [
        "/images/google.png",
        "/login", "/register", "/register-shop",
        "/employee_login/manager", "/employee_login/productHead",
        "/employee_login/delivery_assistant", "/restricted", "/offline",
        "/api/get_shops", "/api/get_user", "/api/auth/is_auth",
        "/api/auth/login", "/api/auth/register", "/api/auth/logout",
        "/api/auth/googlesignin", "/api/auth/callback", "/api/sendmail",
        "/api/get_categories", "/api/search/products", "/api/search/categories", 
        "/api/search/shops", "/api/get_categ_pdts"
    ];

    // ✅ Allow Public Routes Without Authentication
    if (publicRoutes.includes(currPath) || currPath === "/") {
        console.log("✅ Public Route accessed");
        return NextResponse.next();
    }

    try {
        // Get session from Supabase
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !session?.user) {
            console.log("❌ User not authenticated. Redirecting...");
            return NextResponse.redirect(new URL("/login?error=Please log in", req.url));
        }

        const user = session.user;
        console.log("✅ Authenticated User:", user.email);

        // ✅ Check User Role in `ShopSync_Users`
        const { data: userData, error: userError } = await supabase
            .from("ShopSync_Users")
            .select("*")
            .eq("authid", user.id)
            .single();

        if (!userData || userError) {
            console.log("❌ User not found in ShopSync_Users", userError);
            return NextResponse.redirect(new URL("/restricted?error=User not found", req.url));
        }

        console.log("✅ Verified User in ShopSync_Users:", userData.email);

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

        // ✅ If on "/" and logged in, redirect to respective home page
        if (currPath === "/") {
            const roleRedirects: Record<string, string> = {
                manager: "/manager/home",
                producthead: "/producthead/home",
                deliveryassistant: "/deliveryassistant/home"
            };

            if (roleRedirects[userData.role]) {
                console.log(`🔄 Redirecting to ${roleRedirects[userData.role]}`);
                return NextResponse.redirect(new URL(roleRedirects[userData.role], req.url));
            }
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