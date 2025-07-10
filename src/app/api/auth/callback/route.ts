import { supabase } from "@/util/supabase";
import { NextResponse } from "next/server";
import { CreateUser } from "@/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const role = searchParams.get('role') || 'customer';

    console.log("🔐 OAuth Callback Params:", { code, error, role });

    // Handle OAuth errors
    if (error) {
      console.error("❌ OAuth Error:", error);
      return NextResponse.redirect(new URL("/login?error=oauth_failed", request.url));
    }

    // If no code, this isn't a valid OAuth callback
    if (!code) {
      console.error("❌ Missing OAuth Code");
      return NextResponse.redirect(new URL("/login?error=missing_code", request.url));
    }

    // Exchange the code for a session
    const { data: { session, user }, error: authError } = 
      await supabase.auth.exchangeCodeForSession(code);

    if (authError || !user) {
      console.error("❌ Session Exchange Failed:", authError?.message);
      return NextResponse.redirect(new URL("/login?error=session_failed", request.url));
    }

    console.log("✅ User Authenticated:", user.email);

    // Check if user exists in your database
    const { data: profile, error: dbError } = await supabase
      .from('ShopSync_Users')
      .select('*')
      .eq('authid', user.id)
      .single();

    // Create user if doesn't exist
    if (!profile) {
      console.log("Creating new user profile for Google OAuth user");
      
      const dbResponse = await CreateUser(
        user.email?.split('@')[0] || `user_${Math.random().toString(36).slice(2, 8)}`,
        user.email || '',
        user.id,
        { latitude: 0, longitude: 0 }, // Default location, user can update later
        role
      );

      if (dbResponse?.error) {
        console.error("❌ Profile Creation Failed:", dbResponse.error);
        return NextResponse.redirect(new URL("/login?error=profile_creation", request.url));
      }
    }

    // Redirect based on role
    const roleRedirects: Record<string, string> = {
      manager: "/manager/home",
      producthead: "/producthead/home", 
      deliveryassistant: "/deliveryassistant/home",
      customer: "/"
    };

    const redirectUrl = roleRedirects[profile?.role || role] || "/";
    return NextResponse.redirect(new URL(redirectUrl, request.url));

  } catch (err) {
    console.error("❌ Callback Error:", err);
    return NextResponse.redirect(new URL("/login?error=internal_error", request.url));
  }
}