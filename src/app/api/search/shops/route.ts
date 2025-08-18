import { db } from "@/db";
import { ShopSync_Shops } from "@/db/schema";
import { ilike } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q) return NextResponse.json({ shops: [] });

  const shops = await db
    .select({
      id: ShopSync_Shops.id,
      name: ShopSync_Shops.name,
    })
    .from(ShopSync_Shops)
    .where(ilike(ShopSync_Shops.name, `%${q}%`))
    .limit(5);

  return NextResponse.json({ shops });
}
