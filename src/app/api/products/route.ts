import { db } from "@/db";
import { ShopSync_Products } from "@/db/schema";
import { eq } from "drizzle-orm";
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
      .select()
      .from(ShopSync_Products)
      .where(eq(ShopSync_Products.shopId, shopId));

    return NextResponse.json({ products }, { status: 200 });
  } catch (err) {
    console.error("Error fetching product by ID:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// This code defines an API route that retrieves a product by its ID from the database.
// It expects a query parameter 'q' which should be a valid product ID. If the parameter is missing or invalid, it returns a 400 error.