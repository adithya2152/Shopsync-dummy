import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db'; // Assuming your db instance is exported from here
import { ShopSync_Coupons } from '@/db/schema'; // Your Drizzle schema
import { eq, and } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  // Extract shopId from the URL parameters
  const shopId = req.nextUrl.searchParams.get("shopId");

  // Validate that shopId is provided
  if (!shopId) {
    return NextResponse.json(
      { error: 'Shop ID is required' },
      { status: 400 }
    );
  }

  const parsedShopId = parseInt(shopId, 10);

  // Validate that shopId is a valid number
  if (isNaN(parsedShopId)) {
    return NextResponse.json(
        { error: 'Invalid Shop ID format' },
        { status: 400 }
    );
  }

  const couponCode = req.nextUrl.searchParams.get("code");

  let coupons;

  if (couponCode) {
    coupons = await db
      .select()
      .from(ShopSync_Coupons)
      .where(and(
        eq(ShopSync_Coupons.shopId, parsedShopId),
        eq(ShopSync_Coupons.code, couponCode)));
    if (coupons.length === 0) {
      return NextResponse.json(
        { error: 'Coupon not found' },
        { status: 400 }
      );
    }
  }

  try {
    // Fetch all coupons from the database where the shopId matches
    coupons = await db
      .select()
      .from(ShopSync_Coupons)
      .where(eq(ShopSync_Coupons.shopId, parsedShopId));

    // If no coupons are found, you might want to return an empty array
    // which is the default behavior and often desired.
    // Alternatively, you could return a 404 Not Found status.
    if (coupons.length === 0) {
        console.log(`No coupons found for shop ID: ${parsedShopId}`);
    }

    // Return the found coupons with a 200 OK status
    return NextResponse.json(coupons, { status: 200 });

  } catch (error) {
    // Log the error for debugging purposes
    console.error('Failed to fetch coupons:', error);

    // Return a generic server error response
    return NextResponse.json(
      { error: 'An internal server error occurred.' },
      { status: 500 }
    );
  }
}
