import { db } from "@/db";
import { ShopSync_Users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";


export async function GET(req: NextRequest) {

    
    const cookie = req.cookies.get("user");
    if (!cookie) {
        return NextResponse.json({ error: "No user cookie found" }, { status: 401 });
    }   

    const decoded = decodeURIComponent(cookie.value);
    const { id } = JSON.parse(decoded);
    const data = await db
    .select()
    .from(ShopSync_Users)
    .where(eq(ShopSync_Users.authid,id));
    
    if (!data) return NextResponse.json({ error: "User not found" }, { status: 404 });
    const user = data[0];
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 }); 

    return NextResponse.json({
    username: user.username,
    homeLoc: user.homeLoc,
    });
}

export async function POST(req: NextRequest) {
    const body = await req.json();
    const { authid, username, homeLoc } = body;
    if (!authid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    if (!username || !homeLoc) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    
    await db
    .update(ShopSync_Users)
    .set({
        username,
        homeLoc,
        updatedAt: new Date(),
    })
    .where(eq(ShopSync_Users.authid, authid));

    return NextResponse.json({ success: true });
}
