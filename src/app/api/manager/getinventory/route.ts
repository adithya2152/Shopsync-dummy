import { getInventory } from "@/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const shopIdParam = url.searchParams.get("shopId");
    
    if (!shopIdParam) {
      return NextResponse.json({ error: "Missing shopId" }, { status: 400 });
    }

    const shopId = parseInt(shopIdParam);

    if (isNaN(shopId)) {
      return NextResponse.json({ error: "Invalid shopId" }, { status: 400 });
    }

    const inventory = await getInventory(shopId);
    return NextResponse.json(inventory, { status: 200 });
  } catch (error) {
    console.error("❌ API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
