import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { ShopSync_Users, ShopSync_Orders, ShopSync_OrderItems, ShopSync_Products, ShopSync_Coupons } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { calculateCartTotals } from "@/helper/calculateCart";

interface OfflineOrder {
  id: string;
  cart: any[];
  shopId: number;
  address: any;
  paymentMethod: string;
  coupon?: string;
  timestamp: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { offlineOrders }: { offlineOrders: OfflineOrder[] } = body;

    const cookie = req.cookies.get("user");
    if (!cookie) {
      return NextResponse.json({ error: "No user cookie found" }, { status: 401 });
    }

    const decoded = decodeURIComponent(cookie.value);
    const { id } = JSON.parse(decoded);

    const userData = await db
      .select()
      .from(ShopSync_Users)
      .where(eq(ShopSync_Users.authid, id));

    if (!userData || userData.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = userData[0];
    const syncedOrders = [];
    const failedOrders = [];

    for (const offlineOrder of offlineOrders) {
      try {
        const checkoutData = await calculateCartTotals(
          offlineOrder.cart, 
          offlineOrder.shopId, 
          {
            latitude: offlineOrder.address.latitude, 
            longitude: offlineOrder.address.longitude
          }, 
          offlineOrder.coupon
        );

        if (checkoutData.error) {
          failedOrders.push({
            offlineId: offlineOrder.id,
            error: checkoutData.error
          });
          continue;
        }

        const enrichedCart = checkoutData.cart!;
        const total = checkoutData.total;

        // Create Order
        const [newOrder] = await db
          .insert(ShopSync_Orders)
          .values({
            customerId: user.authid,
            shopId: offlineOrder.shopId,
            deliveryAssistantId: null,
            estimatedDelivery: null,
            actualDelivery: null,
            DelLoc: offlineOrder.address,
            totalAmount: total?.toString(),
            paymentMethod: offlineOrder.paymentMethod === "cod" ? "Cash" : offlineOrder.paymentMethod,
            plt_fee: (checkoutData.platformFees || "0").toString(),
            del_fee: (checkoutData.deliveryCharges || "0").toString(),
            tax: (checkoutData.tax || "0").toString(),
            discount_amount: (checkoutData.discountAmount || "0").toString(),
          })
          .returning();

        // Insert Order Items
        const orderItemsData = enrichedCart.map(item => ({
          orderId: newOrder.id,
          productId: item.id,
          quantity: item.quantity,
          price: item.price.toString(),
        }));

        await db.insert(ShopSync_OrderItems).values(orderItemsData);

        // Update stock
        for (const item of orderItemsData) {
          await db
            .update(ShopSync_Products)
            .set({
              stock: sql`GREATEST(${ShopSync_Products.stock} - ${item.quantity}, 0)`
            })
            .where(eq(ShopSync_Products.id, item.productId));
        }

        // Update coupon usage
        if (offlineOrder.coupon) {
          await db
            .update(ShopSync_Coupons)
            .set({
              uses: sql`${ShopSync_Coupons.uses} + 1`
            })
            .where(eq(ShopSync_Coupons.code, offlineOrder.coupon));
        }

        syncedOrders.push({
          offlineId: offlineOrder.id,
          orderId: newOrder.id
        });

      } catch (error) {
        console.error(`Error syncing offline order ${offlineOrder.id}:`, error);
        failedOrders.push({
          offlineId: offlineOrder.id,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }

    return NextResponse.json({
      message: "Offline orders sync completed",
      synced: syncedOrders,
      failed: failedOrders,
      totalProcessed: offlineOrders.length
    }, { status: 200 });

  } catch (error) {
    console.error("Error syncing offline orders:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}