// src/app/api/geocode/route.ts

import { NextRequest, NextResponse } from "next/server";
import NodeGeocoder, { Options } from "node-geocoder";
import fetch from "node-fetch";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;

    const address = {
      house_number: searchParams.get("house_number") || "",
      street_address: searchParams.get("street_address") || "",
      address_line2: searchParams.get("address_line2") || "",
      city: searchParams.get("city") || "",
      pin_code: searchParams.get("pin_code") || "",
    };

    console.log("Received Geocode Request:", address);

  
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      console.error("❌ API Error: Google API Key is missing.");
      return NextResponse.json(
        { error: "Server configuration error." },
        { status: 500 }
      );
    }
    
    const options: Options = {
      provider: "google",
      apiKey: apiKey,
      formatter: null,
      fetch: fetch
    };

    const geocoder = NodeGeocoder(options);

    const result = await geocoder.geocode({
      address: `${address.house_number} ${address.street_address} ${address.address_line2} ${address.city}`,
      country: "IN",
      zipcode: address.pin_code,
    });

    if (result.length > 0) {
      return NextResponse.json(
        {
          latitude: result[0].latitude,
          longitude: result[0].longitude,
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        {
          latitude: null,
          longitude: null,
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("❌ API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
