import { db } from "@/db";
import {
  ShopSync_DeliveryAssistants,
  ShopSync_Users,
  ShopSync_Managers,
} from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    // ✅ Step 1: Get current user from cookies
    const cookie = req.cookies.get("user");
    if (!cookie) {
      return NextResponse.json({ message: "No cookies found", authenticated: false }, { status: 401 });
    }

    const decoded = decodeURIComponent(cookie.value);
    const { id, email } = JSON.parse(decoded);
    if (!id || !email) {
      return NextResponse.json({ error: "Missing id or email" }, { status: 400 });
    }

    // ✅ Step 2: Validate user exists
    const user = await db
      .select()
      .from(ShopSync_Users)
      .where(eq(ShopSync_Users.authid, id));

    if (user.length === 0) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Step 3: Get shops managed by this user
    const managedShops = await db
      .select({ shopId: ShopSync_Managers.shopId })
      .from(ShopSync_Managers)
      .where(eq(ShopSync_Managers.authid, id));

    if (managedShops.length === 0) {
      return NextResponse.json([], { status: 200 }); // No shops assigned
    }

    const shopIds = managedShops.map((s) => s.shopId);

    // ✅ Step 4: Fetch delivery assistants from those shops
    const assistants = await db
      .select({
        authid: ShopSync_DeliveryAssistants.authid,
        shopId: ShopSync_DeliveryAssistants.shopId,
        username: ShopSync_Users.username,
        email: ShopSync_Users.email,
      })
      .from(ShopSync_DeliveryAssistants)
      .leftJoin(ShopSync_Users, eq(ShopSync_DeliveryAssistants.authid, ShopSync_Users.authid))
      .where(inArray(ShopSync_DeliveryAssistants.shopId, shopIds));

    return NextResponse.json(assistants, { status: 200 });

  } catch (error) {
    console.error("[GET /api/manager/delivery-assistants] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
