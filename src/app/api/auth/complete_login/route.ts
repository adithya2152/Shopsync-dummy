import { CreateUser } from "@/db";
import { supabase } from "@/util/supabase";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { access_token, refresh_token } = body;
    let role = "customer" ;

    console.log("🔐 OAuth Access Token Received:", access_token);

    if (!access_token || !role) {
      console.log("❌ Missing access token");
      return NextResponse.json({ error: "Missing access_token or role" }, { status: 400 });
    }

    // ✅ Fetch user info from Supabase using the access_token


    const { data, error } = await supabase.auth.setSession({    access_token, refresh_token })

    if (error) {
        console.error("❌ Supabase OAuth Error:", error.message);
        return NextResponse.json({ error: "OAuth login failed" }, { status: 400 });
    }

    if (!data.user) {
      console.error("❌ No user data returned from Supabase");
      return NextResponse.json({ error: "No user data found" }, { status: 404 });
    }

    const user = data.user;
    const userId = user.id;
    const userEmail = user.email;

    console.log("✅ OAuth User Authenticated:", userId, userEmail);

    // ✅ Fetch role from your DB
    const { data: roleCheck, error: roleError } = await supabase
      .from("ShopSync_Users")
      .select("role")
      .eq("authid", user.id)

    console.log("🔍 Role Check Result:", roleCheck, "Error:", roleError);

    if (!roleCheck || roleCheck.length === 0) {
           await CreateUser(
            user.email?.split('@')[0] || "new_user",
            user.email!,
            userId,
            { latitude: 0, longitude: 0 }, // Default location
            role
        )
        }
        else {
            const roleCheckRow = roleCheck[0];
            if (!roleCheck || roleCheckRow.role !== role) {
              console.error(
                `❌ Invalid Role: Expected '${role}', Found '${roleCheckRow.role || "None"}'`
              );
              role = roleCheckRow.role; 
              
              const res = NextResponse.json({ message: "OAuth Login Successful" });

        res.cookies.set("user", JSON.stringify({ id: userId, email: userEmail }), {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          path: "/",
          sameSite: "strict",
          maxAge: 60 * 60 * 24 * 7,
        });

        res.cookies.set("role", role, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          path: "/",
          sameSite: "strict",
          maxAge: 60 * 60 * 24 * 7,
        });

        return res;
        }
    }


    // ✅ Set cookies
    const res = NextResponse.json({ message: "OAuth Login Successful" });

    res.cookies.set("user", JSON.stringify({ id: userId, email: userEmail }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7,
    });

    res.cookies.set("role", role, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (error) {
    console.error("❌ Internal Error in complete_login:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
