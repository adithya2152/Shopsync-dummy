import { supabase } from "@/util/supabase";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') || 'customer';
    
    console.log("🔐 Received Google Signin Request for role:", role);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXTAUTH_URL}/api/auth/callback?role=${role}`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    });

    if (error) {
      console.error("❌ Google Signin Error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ url: data.url });
  } catch (error) {
    console.error("❌ Google Signin Exception:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}