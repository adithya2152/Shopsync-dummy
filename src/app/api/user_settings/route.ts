import { db } from "@/db";
import { ShopSync_Users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import NodeGeocoder, { Options } from "node-geocoder";
import fetch from "node-fetch";

type Address = {
    id: string;
    label: string;
    house_number: string;
    street_address: string;
    address_line2: string;
    city: string;
    pin_code: string;
    latitude: number | null;
    longitude: number | null;
};


export async function GET(req: NextRequest) {

    
    const cookie = req.cookies.get("user");
    if (!cookie) {
        return NextResponse.json({ error: "No user cookie found" }, { status: 401 });
    }   

    const decoded = decodeURIComponent(cookie.value);
    const { id } = JSON.parse(decoded);
    const data = await db
    .select()
    .from(ShopSync_Users)
    .where(eq(ShopSync_Users.authid,id));
    
    if (!data) return NextResponse.json({ error: "User not found" }, { status: 404 });
    const user = data[0];
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 }); 

    return NextResponse.json({
    username: user.username,
    Phone: user.Phone || "",
    homeLoc: user.homeLoc,
    homeLoc2: user.homeLoc2 || null
    });
}


async function geocode(address: Address) {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        console.error("❌ API Error: Google API Key is missing.");
        return {
            latitude: null,
            longitude: null,
        }
    }

    const options: Options = {
        provider: "google",
        apiKey: apiKey,
        formatter: null,
        fetch: fetch
    };
    
    const geocoder = NodeGeocoder(options);
    try {
        const result = await geocoder.geocode({
            address: `${address.house_number} ${address.street_address} ${address.address_line2} ${address.city}`,
            country: "IN",
            zipcode: address.pin_code,
        });

        if (result.length > 0) {
            const ret = {
                latitude: result[0].latitude || null,
                longitude: result[0].longitude || null,
            };
            console.log("Geocoding result:", ret);
            return ret;
        }
        return {
            latitude: null,
            longitude: null,
        };
    } catch (error) {
        console.error("Geocoding error:", error);
        return {
            latitude: null,
            longitude: null,
        };
    }
}

// (Assuming geocoder is initialized once at the top of the file)

export async function POST(req: NextRequest) {
    let body;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }

    const { authid, username, Phone, homeLoc, homeLoc2 } = body;

    if (!authid) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    if (!username || !homeLoc || !Phone) {
        return NextResponse.json({ error: "Missing required fields: username, homeLoc, phone are required" }, { status: 400 });
    }

    if (!homeLoc.house_number || !homeLoc.street_address || !homeLoc.city || !homeLoc.pin_code) {
        return NextResponse.json({ error: "Invalid home location. Please provide complete address details."
        }, { status: 400 });
    }

    // Check for API key before proceeding
    if (!process.env.GOOGLE_API_KEY) {
        console.error("❌ Configuration Error: Google API Key is missing.");
        return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const existingUserRes = await db
    .select()
    .from(ShopSync_Users)
    .where(eq(ShopSync_Users.authid, authid))

    const existingUser = existingUserRes[0];

    let newHomeLoc = existingUser?.homeLoc;
    let newHomeLoc2 = existingUser?.homeLoc2;

    // Geocode primary home location only if it's new or has changed
    if (JSON.stringify(existingUser?.homeLoc) !== JSON.stringify(homeLoc)) {
        const { latitude, longitude } = await geocode(homeLoc);
        if (latitude && longitude) {
            newHomeLoc = { ...homeLoc, latitude, longitude };
        } else {
            return NextResponse.json({ error: "Invalid primary home location. Could not geocode." }, { status: 400 });
        }
    }

    // Geocode secondary location if it exists and has changed
    if (homeLoc2) {
         if (JSON.stringify(existingUser?.homeLoc2) !== JSON.stringify(homeLoc2)) {
            const { latitude, longitude } = await geocode(homeLoc2);
            if (latitude && longitude) {
                newHomeLoc2 = { ...homeLoc2, latitude, longitude };
            } else {
                return NextResponse.json({ error: "Invalid secondary home location. Could not geocode." }, { status: 400 });
            }
        }
    } else {
        newHomeLoc2 = null; // Handle case where homeLoc2 is removed
    }

    await db
        .update(ShopSync_Users)
        .set({
            username,
            Phone,
            homeLoc: newHomeLoc,
            homeLoc2: newHomeLoc2,
            updatedAt: new Date(),
        })
        .where(eq(ShopSync_Users.authid, authid));

    return NextResponse.json({ success: true, message: "User profile updated." });
}