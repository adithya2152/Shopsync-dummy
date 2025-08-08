import { db } from "@/db";
import { ShopSync_Products, ShopSync_Shops } from "@/db/schema";
import { ilike, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q) return NextResponse.json({ products: [] });

  const products = await db
    .select({
      id: ShopSync_Products.id,
      name: ShopSync_Products.name,
      shopId: ShopSync_Products.shopId,
      shopName: ShopSync_Shops.name,
    })
    .from(ShopSync_Products)
    .innerJoin(
      ShopSync_Shops,
      eq(ShopSync_Products.shopId, ShopSync_Shops.id)
    )
    .where(ilike(ShopSync_Products.name, `%${q}%`))
    //unique only 
    .groupBy(ShopSync_Products.id, ShopSync_Products.name, ShopSync_Products.shopId, ShopSync_Shops.name);


  const shopId = parseInt(req.nextUrl.searchParams.get("shopId") || "0", 10);
  if (shopId > 0) {
    return NextResponse.json({
      products: products.filter((product) => product.shopId === shopId),
    })
  }
  return NextResponse.json({ products });
}
