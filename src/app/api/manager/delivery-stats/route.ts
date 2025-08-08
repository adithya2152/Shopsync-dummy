import { db } from "@/db";
import { 
  ShopSync_Orders, 
  ShopSync_Managers 
} from "@/db/schema";
import { eq, count, and, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const cookie = req.cookies.get("user");
    if (!cookie) {
      return NextResponse.json({ error: "No user cookie found" }, { status: 401 });
    }

    const decoded = decodeURIComponent(cookie.value);
    const { id } = JSON.parse(decoded);

    // Get manager's shops
    const managedShops = await db
      .select({ shopId: ShopSync_Managers.shopId })
      .from(ShopSync_Managers)
      .where(eq(ShopSync_Managers.authid, id));

    if (managedShops.length === 0) {
      return NextResponse.json({ error: "No shops managed" }, { status: 404 });
    }

    const shopIds = managedShops.map(s => s.shopId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get delivery statistics
    const [pending, outForDelivery, completedToday, delayed] = await Promise.all([
      // Pending orders
      db
        .select({ count: count() })
        .from(ShopSync_Orders)
        .where(
          and(
            sql`${ShopSync_Orders.shopId} = ANY(${shopIds})`,
            eq(ShopSync_Orders.status, "Pending")
          )
        ),
      
      // Out for delivery
      db
        .select({ count: count() })
        .from(ShopSync_Orders)
        .where(
          and(
            sql`${ShopSync_Orders.shopId} = ANY(${shopIds})`,
            eq(ShopSync_Orders.status, "Out for Delivery")
          )
        ),
      
      // Completed today
      db
        .select({ count: count() })
        .from(ShopSync_Orders)
        .where(
          and(
            sql`${ShopSync_Orders.shopId} = ANY(${shopIds})`,
            eq(ShopSync_Orders.status, "Completed"),
            sql`DATE(${ShopSync_Orders.actualDelivery}) = CURRENT_DATE`
          )
        ),
      
      // Delayed orders (estimated delivery passed but not completed)
      db
        .select({ count: count() })
        .from(ShopSync_Orders)
        .where(
          and(
            sql`${ShopSync_Orders.shopId} = ANY(${shopIds})`,
            sql`${ShopSync_Orders.estimatedDelivery} < NOW()`,
            sql`${ShopSync_Orders.status} != 'Completed'`
          )
        )
    ]);

    // Calculate on-time delivery rate
    const totalDelivered = await db
      .select({ count: count() })
      .from(ShopSync_Orders)
      .where(
        and(
          sql`${ShopSync_Orders.shopId} = ANY(${shopIds})`,
          eq(ShopSync_Orders.status, "Completed"),
          sql`${ShopSync_Orders.actualDelivery} IS NOT NULL`
        )
      );

    const onTimeDelivered = await db
      .select({ count: count() })
      .from(ShopSync_Orders)
      .where(
        and(
          sql`${ShopSync_Orders.shopId} = ANY(${shopIds})`,
          eq(ShopSync_Orders.status, "Completed"),
          sql`${ShopSync_Orders.actualDelivery} <= ${ShopSync_Orders.estimatedDelivery}`
        )
      );

    const onTimeRate = totalDelivered[0]?.count > 0 
      ? Math.round((onTimeDelivered[0]?.count / totalDelivered[0]?.count) * 100)
      : 100;

    return NextResponse.json({
      pending: pending[0]?.count || 0,
      outForDelivery: outForDelivery[0]?.count || 0,
      completedToday: completedToday[0]?.count || 0,
      delayed: delayed[0]?.count || 0,
      onTimeRate
    });

  } catch (error) {
    console.error("Delivery stats API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}