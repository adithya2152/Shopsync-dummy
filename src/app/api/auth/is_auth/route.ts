import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/util/supabase";

export async function GET(req: NextRequest) {
  try {
    // Get session from Supabase
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session?.user) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    const user = session.user;

    // Get user role from database
    const { data: profile, error: profileError } = await supabase
      .from('ShopSync_Users')
      .select('role')
      .eq('authid', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    return NextResponse.json({ 
      authenticated: true, 
      role: profile.role,
      user: user 
    }, { status: 200 });
  } catch (err) {
    console.error("Auth check error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}