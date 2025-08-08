// /app/api/auth/is-auth.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db"; // your drizzle db instance
import { ShopSync_Users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {

    const cookie = req.cookies.get("user");
    if (!cookie) {
      return NextResponse.json({message : "No cookies found ", authenticated: false }, { status: 200 });
    }
    const decoded = decodeURIComponent(cookie.value);
    const { id, email } = JSON.parse(decoded);
    if (!id || !email) {
      return NextResponse.json({ error: "Missing id or email" }, { status: 400 });
    }

    const user = await db
      .select()
      .from(ShopSync_Users)
      .where(eq(ShopSync_Users.authid, id));

    if (user.length === 0) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    return NextResponse.json({ authenticated: true, role: user[0].role }, { status: 200 });
  } catch (err) {
    console.error("Auth check error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
