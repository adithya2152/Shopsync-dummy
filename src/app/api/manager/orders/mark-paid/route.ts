import { NextResponse } from "next/server";
import { drizzle } from "@/db";
import { eq } from "drizzle-orm";
import { client } from "@/db"; // Ensure this import is at the top of your file

import { ShopSync_Orders } from "@/db/schema";

export async function PUT(req: Request) {
  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }

    // Import your database client from the appropriate location

    const db = drizzle(client);

    await db
      .update(ShopSync_Orders)
      .set({
        paymentStatus: "Completed"
      })
      .where(eq(ShopSync_Orders.id, orderId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT /api/manager/orders/mark-paid error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
