import { db } from "@/db";
import { ShopSync_Users, ShopSync_Orders, ShopSync_OrderItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";


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
    const { shopId, cart, address, paymentMethod }: { shopId: number, cart: EnrichedCartItem[], address: Address, paymentMethod: string} = body;

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

    const response = await axios.post("http://localhost:3000/api/checkout/summary", {
      cart,
      shopId
    });

    const checkoutData = response.data;
    const enrichedCart: EnrichedCartItem[] = checkoutData.cart;
    const total = checkoutData.total;

    // Create Order

    console.log("placing order for user:", user.authid, "\ncart: ", JSON.stringify(enrichedCart, null, 2), "\ntotal: ", total, "\naddress: ", JSON.stringify(address, null, 2));

    const [newOrder] = await db
      .insert(ShopSync_Orders)
      .values({
        customerId: user.authid,
        shopId,
        deliveryAssistantId: null,
        estimatedDelivery: null,
        actualDelivery: null,
        DelLoc: address,
        totalAmount: total,
        paymentMethod: paymentMethod === "cod" ? "Cash" : paymentMethod,
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

    return NextResponse.json({
      message: "Order placed successfully",
      orderId: newOrder.id,
    }, { status: 201 });

  } catch (error) {
    console.error("Error placing order:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
