import { getCategories } from "@/db";
import { NextResponse } from "next/server";

export async  function GET()
{
    try {
        
        const categories = await getCategories();
        return NextResponse.json(categories, { status: 200 });
    } catch (error) {
        
        console.error("❌ API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}