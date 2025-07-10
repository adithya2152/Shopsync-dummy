import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/util/supabase";

export async function GET(req: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: "No authorization header found" }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];

    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    return NextResponse.json({ 
      id: user.id, 
      email: user.email 
    }, { status: 200 });
  } catch (err) {
    console.error("Get user failed", err);
    return NextResponse.json({ error: "Invalid user session" }, { status: 400 });
  }
}