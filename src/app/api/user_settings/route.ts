import { db } from "@/db";
import { ShopSync_Users } from "@/db/schema";
import { eq } from "drizzle-orm";
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

        const data = await db
            .select()
            .from(ShopSync_Users)
            .where(eq(ShopSync_Users.authid, user.id));
        
        if (!data || data.length === 0) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const userData = data[0];

        return NextResponse.json({
            username: userData.username,
            homeLoc: userData.homeLoc,
        });
    } catch (err) {
        console.error("Error fetching user settings:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { username, homeLoc } = body;
        
        // Get session from Supabase
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !session?.user) {
            return NextResponse.json({ error: "No active session" }, { status: 401 });
        }
        
        const user = session.user;
        
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
            .where(eq(ShopSync_Users.authid, user.id));

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Error updating user settings:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}