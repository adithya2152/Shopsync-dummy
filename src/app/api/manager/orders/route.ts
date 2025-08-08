// File: /app/api/manager/orders/route.ts
import { NextResponse } from "next/server";
import { drizzle } from "@/db";
import { client } from "@/db"; //
import { ShopSync_Orders } from "@/db/schema"; // ✅ correct import
import { eq } from "drizzle-orm";

export async function PUT(req: Request) {
  try {
    const data = await req.json();
    const { orderId, status, paymentStatus, deliveryAssistantId, estimatedDelivery } = data;

    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }

    
    const db = drizzle(client);

    const updates: Partial<typeof ShopSync_Orders.$inferInsert> = {
      ...(status && { status }),
      ...(paymentStatus && { paymentStatus }),
      deliveryAssistantId: deliveryAssistantId || null,
      estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : null,
    };

    await db
      .update(ShopSync_Orders)
      .set({
        ...updates
      })
      .where(eq(ShopSync_Orders.id, orderId));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PUT /api/manager/orders error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// File: /app/api/manager/orders/mark-paid/route.ts
// import { NextResponse } from "next/server";
// import { drizzle } from "@/db";
// import { ShopSync_Orders } from "@/db/schema";
//     import { client } from "@/db"; // Make sure this import is at the top of your file

// import { eq } from "drizzle-orm";

// export async function PUT(req: Request) {
//   try {
//     const { orderId } = await req.json();

//     if (!orderId) {
//       return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
//     }

//     // Import your database client from the appropriate location

//     const db = drizzle(client);

//     await db
//       .update(ShopSync_Orders)
//       .set({
//         paymentStatus: "Completed"
//       })
//       .where(eq(ShopSync_Orders.id, orderId));

//     return NextResponse.json({ success: true });
//   } catch (error) {
//     console.error("PUT /api/manager/orders/mark-paid error:", error);
//     return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
//   }
// }
