import { admin_supabase, supabase } from "@/util/supabase";
import { NextResponse } from "next/server";
import { CreateUser } from "@/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, email, password, lat, long, role } = body;

    console.log("🔐 Received Register Request:", {
      username,
      email,
      lat,
      long,
      role,
    });
    //check if email already exists supabase auth table
    // ✅ **Check for missing fields**
    if (!username || !email || !password || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // ✅ **Create Supabase User**
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      console.error("❌ Supabase Signup Error:", error.message);
      return NextResponse.json({ error: error.message}, { status: 400 });
    }

    const user = data?.user;
    if (!user) {
      return NextResponse.json(
        { error: "User creation failed" },
        { status: 500 }
      );
    }

    console.log("✅ Supabase User Created:", user.id);

    // ✅ **Insert user into database**
    const dbResponse = await CreateUser(
      username,
      email,
      user.id,
      { latitude: lat, longitude: long },
      role
    );

    if (dbResponse?.error) {
      console.error("❌ Database Insert Error:", dbResponse.error);

      // 🔥 **Rollback: Delete the user from Supabase Auth**
      await admin_supabase.auth.admin.deleteUser(user.id);
      console.log("🗑️ User deleted from Supabase Auth due to DB error.");

      return NextResponse.json(
        { error: "Database error. Please try again." },
        { status: 500 }
      );
    }

    console.log("✅ User inserted into DB");

    // ✅ **Set authentication cookies**
    const response = NextResponse.json(
      { message: "User registered successfully" },
      { status: 201 }
    );

    response.cookies.set("user", JSON.stringify({ id: user.id, email: user.email }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    response.cookies.set("role", role, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    return response;
  } catch (error) {
    console.error("❌ Internal Server Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
