import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/util/supabase";

export async function GET(req: NextRequest) {
  try {
    // Get session from Supabase
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session?.user) {
      return NextResponse.json({ error: "No active session" }, { status: 401 });
    }

    const user = session.user;

    return NextResponse.json({ 
      id: user.id, 
      email: user.email 
    }, { status: 200 });
  } catch (err) {
    console.error("Get user failed", err);
    return NextResponse.json({ error: "Invalid user session" }, { status: 400 });
  }
}