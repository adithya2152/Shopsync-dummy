import { db } from "@/db";
import {
  ShopSync_Orders,
  ShopSync_OrderItems,
  ShopSync_Products,
  ShopSync_Shops,
  ShopSync_Users,
} from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const shopId = url.searchParams.get("q");

    if (!shopId) {
      return NextResponse.json({ error: "Missing shopId in query." }, { status: 400 });
    }

    const orders = await db
      .select()
      .from(ShopSync_Orders)
      .where(eq(ShopSync_Orders.shopId, Number(shopId)))
      .leftJoin(ShopSync_OrderItems, eq(ShopSync_OrderItems.orderId, ShopSync_Orders.id))
      .leftJoin(ShopSync_Products, eq(ShopSync_Products.id, ShopSync_OrderItems.productId))
      .leftJoin(ShopSync_Shops, eq(ShopSync_Shops.id, ShopSync_Orders.shopId))
      .leftJoin(ShopSync_Users, eq(ShopSync_Users.authid, ShopSync_Orders.deliveryAssistantId)); // Only for delivery assistant

    if (!orders.length) {
      return NextResponse.json([], { status: 200 });
    }

    // Fetch all customer authids in one shot
    const uniqueCustomerIds = [
      ...new Set(orders.map((row) => row.ShopSync_Orders.customerId)),
    ];

    const customers = await db
      .select()
      .from(ShopSync_Users)
      .where(inArray(ShopSync_Users.authid, uniqueCustomerIds));

    const customerMap = new Map(
      customers.map((c) => [c.authid, { name: c.username, email: c.email , Phone: c.Phone}])
    );

    const groupedOrders: Record<number, unknown> = {};

    for (const row of orders) {
      const order = row.ShopSync_Orders;
      const item = row.ShopSync_OrderItems;
      const product = row.ShopSync_Products;
      const assistant = row.ShopSync_Users;
      const customerInfo = customerMap.get(order.customerId);

      if (!groupedOrders[order.id]) {
        groupedOrders[order.id] = {
          orderId: order.id,
          customerId: order.customerId,
          customerName: customerInfo?.name || "Unknown",
          customerEmail: customerInfo?.email || "Unknown",
          customerPhone: customerInfo?.Phone || "Unknown",
          shopID: order.shopId,
          shopName: row.ShopSync_Shops?.name,
          deliveryAssistantId: order.deliveryAssistantId,
          deliveryAssistantName: assistant?.username || null,
          status: order.status,
          totalAmount: order.totalAmount,
          paymentStatus: order.paymentStatus,
          paymentMethod: order.paymentMethod,
          estimatedDelivery: order.estimatedDelivery,
          actualDelivery: order.actualDelivery,
          createdAt: order.createdAt,
          delLoc: order.DelLoc,
          d_rating: order.d_rating,
          plt_fee: order.plt_fee,
          del_fee: order.del_fee,
          tax: order.tax,
          discount_amount: order.discount_amount,
          items: [],
        };
      }

      if (item && product) {
        (groupedOrders[order.id] as { items: unknown[] }).items.push({
          productId: product.id,
          productName: product.name,
          quantity: item.quantity,
          price: item.price,
          rating: item.rating,
        });
      }
    }

    return NextResponse.json(Object.values(groupedOrders), { status: 200 });

  } catch (error) {
    console.error("[GET /api/manager/orders] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
