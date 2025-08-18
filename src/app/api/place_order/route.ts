import { db } from "@/db";
import { ShopSync_Users, ShopSync_Orders, ShopSync_OrderItems, ShopSync_Products, ShopSync_Coupons, ShopSync_PlatformSettings } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { calculateCartTotals } from "@/helper/calculateCart";


interface EnrichedCartItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
}

interface Address {
  house_number: string;
  street_address: string;
  address_line2: string;
  city: string;
  pin_code: string;
  latitude: number,
  longitude: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { shopId, cart, address, paymentMethod, coupon }: { shopId: number, cart: EnrichedCartItem[], address: Address, paymentMethod: string, coupon?: string} = body;

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

    // const response = await axios.post("http://localhost:3000/api/checkout/summary", {
    //   cart,
    //   shopId,
    //   coupon,
    // });

    const checkoutData = await calculateCartTotals(cart, shopId, {latitude: address.latitude, longitude: address.longitude}, coupon);

    console.log("CHECKOUT SUMMARY DATA:", checkoutData);
    const enrichedCart: EnrichedCartItem[] = checkoutData.cart!;
    const total = checkoutData.total;

    const platformSettings = await db
    .select()
    .from(ShopSync_PlatformSettings)


    // fetch estimated delivery time from platform setting (in seconds), default to 25 minutes if not set
    const estimatedSeconds = parseFloat(platformSettings.find(
      (setting) => setting.key === "estimated_delivery_time"
    )?.value || "1500");

    const estimatedDelivery = new Date(Date.now() + estimatedSeconds * 1000);

    console.log("placing order for user:", user.authid, "\ncart: ", JSON.stringify(enrichedCart, null, 2), "\ncheckoutdata", JSON.stringify(checkoutData, null, 2));

    const [newOrder] = await db
      .insert(ShopSync_Orders)
      .values({
        customerId: user.authid,
        shopId,
        deliveryAssistantId: null,
        estimatedDelivery: estimatedDelivery,
        actualDelivery: null,
        DelLoc: address,
        totalAmount: total?.toString(),
        paymentMethod: paymentMethod === "cod" ? "Cash" : paymentMethod,
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

    for (const item of orderItemsData) {
      await db
        .update(ShopSync_Products)
        .set({
          stock: sql`GREATEST(${ShopSync_Products.stock} - ${item.quantity}, 0)`
        })
        .where(eq(ShopSync_Products.id, item.productId));
    }
  
    if (coupon) {
      await db
        .update(ShopSync_Coupons)
        .set({
          uses: sql`${ShopSync_Coupons.uses} + 1`
        })
        .where(eq(ShopSync_Coupons.code, coupon));
    }

    return NextResponse.json({
      message: "Order placed successfully",
      orderId: newOrder.id,
    }, { status: 201 });

  } catch (error) {
    console.error("Error placing order:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
