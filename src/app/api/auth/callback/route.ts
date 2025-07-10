// app/api/auth/callback/route.ts
import { supabase } from "@/util/supabase";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

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
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // Create user if doesn't exist
    if (!profile) {
      const { error: createError } = await supabase
        .from('profiles')
        .insert([{
          id: user.id,
          email: user.email,
          role,
          username: user.email?.split('@')[0] || `user_${Math.random().toString(36).slice(2, 8)}`
        }]);

      if (createError) {
        console.error("❌ Profile Creation Failed:", createError.message);
        return NextResponse.redirect(new URL("/login?error=profile_creation", request.url));
      }
    }

    // Set cookies
    const response = NextResponse.redirect(new URL("/dashboard", request.url));
    response.cookies.set("sb-access-token", session?.access_token || "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    response.cookies.set("sb-refresh-token", session?.refresh_token || "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;

  } catch (err) {
    console.error("❌ Callback Error:", err);
    return NextResponse.redirect(new URL("/login?error=internal_error", request.url));
  }
}