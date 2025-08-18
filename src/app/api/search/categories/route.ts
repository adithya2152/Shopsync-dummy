import { db } from "@/db";
import { ShopSync_Categories } from "@/db/schema";
import { ilike } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q) return NextResponse.json({ categories: [] });

  const categories = await db
    .select({
      id: ShopSync_Categories.id,
      name: ShopSync_Categories.name,
    })
    .from(ShopSync_Categories)
    .where(ilike(ShopSync_Categories.name, `%${q}%`))
    .limit(5);

  return NextResponse.json({ categories });
}
