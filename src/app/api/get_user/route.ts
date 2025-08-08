// /app/api/auth/get-user-from-cookie/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const cookie = req.cookies.get("user");
    if (!cookie) {
      return NextResponse.json({ error: "No user cookie found" }, { status: 401 });
    }

    const decoded = decodeURIComponent(cookie.value);
    const { id, email } = JSON.parse(decoded);

    return NextResponse.json({ id, email } , { status: 200 });
  } catch (err) {
    console.error("Cookie parsing failed", err);
    return NextResponse.json({ error: "Invalid user cookie" }, { status: 400 });
  }
}
