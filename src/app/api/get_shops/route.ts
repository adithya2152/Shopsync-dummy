import { getShops } from "@/db";
import { NextResponse } from "next/server";
export async function GET(req:Request){
    try {
        const url = new URL(req.url);
        const shopId = url.searchParams.get("shopId");
        if(shopId)
        {
            const shopIdNum = parseInt(shopId);
            if(isNaN(shopIdNum))
            {
                return NextResponse.json({ error: "Invalid shopId" }, { status: 400 });
            }
            const shops = await getShops();
            const filteredShops = shops.filter(shop => shop.id === shopIdNum);
            if(filteredShops.length === 0) {
                return NextResponse.json({ error: "Shop not found" }, { status: 404 });
            }
            return NextResponse.json(filteredShops[0].name, { status: 200 });
        }
        const shops = await getShops();
        return NextResponse.json(shops, { status: 200 });
    } catch (error) {
        console.error("❌ API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}