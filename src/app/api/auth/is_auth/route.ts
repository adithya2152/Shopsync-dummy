import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/util/supabase";

export async function GET(req: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    const token = authHeader.split(' ')[1];

    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

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