// src/app/api/reversegeocode/route.ts

import { NextRequest, NextResponse } from "next/server";
import NodeGeocoder, { Options } from "node-geocoder";
import fetch from "node-fetch";
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const latitude = url.searchParams.get("latitude");
    const longitude = url.searchParams.get("longitude");

    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: "Missing latitude or longitude" },
        { status: 400 }
      );
    }
    
   
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
      fetch: fetch ,
    };

    const geocoder = NodeGeocoder(options);

    // 2. Wait for the geocoder.reverse() promise to resolve
    const result = await geocoder.reverse({
      lat: parseFloat(latitude),
      lon: parseFloat(longitude),
    });

    // Now, 'result' will contain the actual address data
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("❌ API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
