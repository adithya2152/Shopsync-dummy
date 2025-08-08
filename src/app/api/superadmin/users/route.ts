import { db } from "@/db";
import { ShopSync_Users } from "@/db/schema";
import { eq, ilike, or } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const role = searchParams.get("role");

    let query = db.select().from(ShopSync_Users);

    if (search) {
      query = query.where(
        or(
          ilike(ShopSync_Users.username, `%${search}%`),
          ilike(ShopSync_Users.email, `%${search}%`)
        )
      );
    }

    if (role && role !== "all") {
      query = query.where(eq(ShopSync_Users.role, role));
    }

    const users = await query;
    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    await db
      .delete(ShopSync_Users)
      .where(eq(ShopSync_Users.authid, userId));

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}