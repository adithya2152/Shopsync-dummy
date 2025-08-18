import { getStoreIDs } from "@/db";
import { NextRequest } from "next/server";
export async function GET(req:NextRequest) {
    try {
         
        const userCookie = req.cookies.get("user")?.value;
        if (!userCookie) {
            return new Response(JSON.stringify({ error: "User not logged in" }), { status: 401 });
        }
        const user = JSON.parse(userCookie);
        const managerAuthId = user.id;
         

        const stores = await getStoreIDs(managerAuthId);
        if (!stores) {
            return new Response(JSON.stringify({ error: "No stores found" }), { status: 404 });
        }

        return new Response(JSON.stringify(stores), { status: 200 });
    } catch (error) {
        console.error("Error fetching stores:", error);
        return new Response(JSON.stringify({ error: "Failed to fetch stores" }), { status: 500 });
    }
}