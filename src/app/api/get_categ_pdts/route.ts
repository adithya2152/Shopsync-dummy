import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { ShopSync_Products, ShopSync_Categories, ShopSync_Shops } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const categId = searchParams.get("categId");

  if (!categId || isNaN(Number(categId))) {
    return NextResponse.json({ error: "Missing 'categId' query parameter" }, { status: 400 });
  }

  const parsedCategId = parseInt(categId, 10);


  try {
    const category = await db
      .select({ id: ShopSync_Categories.id, name: ShopSync_Categories.name })
      .from(ShopSync_Categories)
      .where(eq(ShopSync_Categories.id, parsedCategId));

    if (category.length === 0) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const products = await db
    .select({
      id: ShopSync_Products.id,
      name: ShopSync_Products.name,
      description: ShopSync_Products.description,
      price: ShopSync_Products.price,
      discount: ShopSync_Products.discount,
      ImgPath: ShopSync_Products.imgPath,
      shopId: ShopSync_Products.shopId,
      shopName: ShopSync_Shops.name, // include shop name from joined table
    })
    .from(ShopSync_Products)
    .innerJoin(
      ShopSync_Shops,
      eq(ShopSync_Products.shopId, ShopSync_Shops.id)
    )
    .where(eq(ShopSync_Products.categoryId, category[0].id));

    return NextResponse.json({ products, categoryName: category[0].name }, { status: 200 });
  } catch (err) {
    console.error("Error fetching category products:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
