import { supabase } from "@/util/supabase";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { credentials, role } = body;
    const { email, password } = credentials;

    console.log("🔐 Received Login Request:", { email, role });

    // ✅ **Check for missing fields**
    if (!email || !password || !role) {
      console.log("❌ Missing required fields");
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // ✅ **Authenticate User with Supabase**
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("❌ Supabase Login Error:", error.message);
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 400 }
      );
    }

    const user = data.user;
    console.log("✅ User Authenticated:", user.id);

    // ✅ **Fetch User Role from Database**
    const { data: roleCheck, error: roleError } = await supabase
      .from("ShopSync_Users")
      .select("role")
      .eq("authid", user.id)
      .single();

    console.log("🔍 Role Check Result:", roleCheck, "Error:", roleError);

    // ✅ **Handle Role Issues**
    if (roleError) {
      console.error("❌ Database Role Fetch Error:", roleError.message);
      return NextResponse.json(
        { error: "Error fetching user role" },
        { status: 500 }
      );
    }

    if (!roleCheck || roleCheck.role !== role) {
      console.error(
        `❌ Invalid Role: Expected '${role}', Found '${roleCheck?.role || "None"}'`
      );
      return NextResponse.json(
        { error: `Invalid Role. Expected: '${role}', Found: '${roleCheck?.role || "None"}'` },
        { status: 403 }
      );
    }

    console.log("✅ Role Verified:", roleCheck.role);

    return NextResponse.json(
      { message: "Login Successful", user: user },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Internal Server Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}