import { db } from "@/db";
import { ShopSync_Products, ShopSync_OrderItems } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");

  if (!q) {
    return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 });
  }

  const shopId = parseInt(q, 10);
  if (Number.isNaN(shopId)) {
    return NextResponse.json({ error: "Query parameter 'q' must be a valid number" }, { status: 400 });
  }

  try {
    const products = await db
    .select({
      id: ShopSync_Products.id,
      name: ShopSync_Products.name,
      description: ShopSync_Products.description,
      price: ShopSync_Products.price,
      stock: ShopSync_Products.stock,
      discount: ShopSync_Products.discount,
      imgPath: ShopSync_Products.imgPath,
      shopId: ShopSync_Products.shopId,
      createdAt: ShopSync_Products.createdAt,
      rating: sql`ROUND(AVG(${ShopSync_OrderItems.rating}) * 2) / 2`.as("rating"),
    })
    .from(ShopSync_Products)
    .leftJoin(
      ShopSync_OrderItems,
      eq(ShopSync_Products.id, ShopSync_OrderItems.productId)
    )
    .where(eq(ShopSync_Products.shopId, shopId))
    .groupBy(ShopSync_Products.id);

    return NextResponse.json({ products }, { status: 200 });
  } catch (err) {
    console.error("Error fetching product by ID:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// This code defines an API route that retrieves a product by its ID from the database.
// It expects a query parameter 'q' which should be a valid product ID. If the parameter is missing or invalid, it returns a 400 error.