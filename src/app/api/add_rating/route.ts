import { db } from "@/db";
import { ShopSync_Orders, ShopSync_OrderItems } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { order_id, item_id, rating } = body;

    if (!order_id || typeof rating !== "number" || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const cookie = req.cookies.get("user");
    if (!cookie) {
        return NextResponse.json({ message: "No cookies found ", authenticated: false }, { status: 200 });
    }

    const decoded = decodeURIComponent(cookie.value);
    const { id, email } = JSON.parse(decoded);
    if (!id || !email) {
        return NextResponse.json({ error: "Missing id or email" }, { status: 400 });
    }

    
    if (item_id) {
      // Rating a product in an order
      const updated = await db
        .update(ShopSync_OrderItems)
        .set({ rating })
        .where(and(
          eq(ShopSync_OrderItems.orderId, order_id),
          eq(ShopSync_OrderItems.productId, item_id)
        ));

      return NextResponse.json({ message: "Product rating saved", updated });
    } else {
      // Rating the delivery
      const updated = await db
        .update(ShopSync_Orders)
        .set({ d_rating: rating })
        .where(eq(ShopSync_Orders.id, order_id));

      return NextResponse.json({ message: "Delivery rating saved", updated });
    }
  } catch (error) {
    console.error("Rating error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
