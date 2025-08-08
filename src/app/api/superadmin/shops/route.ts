import { db } from "@/db";
import { 
  ShopSync_Shops, 
  ShopSync_Users, 
  ShopSync_Managers 
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const shops = await db
      .select({
        id: ShopSync_Shops.id,
        name: ShopSync_Shops.name,
        location: ShopSync_Shops.location,
        createdAt: ShopSync_Shops.createdAt,
        managerName: ShopSync_Users.username,
        managerEmail: ShopSync_Users.email,
      })
      .from(ShopSync_Shops)
      .leftJoin(ShopSync_Managers, eq(ShopSync_Managers.shopId, ShopSync_Shops.id))
      .leftJoin(ShopSync_Users, eq(ShopSync_Users.authid, ShopSync_Managers.authid));

    return NextResponse.json(shops);
  } catch (error) {
    console.error("Error fetching shops:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get("shopId");

    if (!shopId) {
      return NextResponse.json({ error: "Missing shopId" }, { status: 400 });
    }

    // Delete shop (cascade will handle related records)
    await db
      .delete(ShopSync_Shops)
      .where(eq(ShopSync_Shops.id, parseInt(shopId)));

    return NextResponse.json({ message: "Shop deleted successfully" });
  } catch (error) {
    console.error("Error deleting shop:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}