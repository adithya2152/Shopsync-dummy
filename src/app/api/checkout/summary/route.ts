import { calculateCartTotals } from "@/helper/calculateCart";
import { NextResponse } from "next/server";



export async function POST(req: Request) {
  const {
    cart,
    coupon,
    shopId,
    homeLoc,
  }: { cart: unknown; coupon: string; shopId: number, homeLoc: {latitude: number, longitude: number} } = await req.json();

  const result = await calculateCartTotals(cart, shopId, homeLoc, coupon);

  if (result.error) {
    return NextResponse.json(
      { errorType: result.errorType, error: result.error },
      { status: result.status }
    );
  }

  return NextResponse.json({
    cart: result.cart,
    subtotal: result.subtotal,
    platformFees: result.platformFees,
    deliveryFees: result.deliveryCharges,
    tax: result.tax,
    total: result.total,
    discountAmount: result.discountAmount,
  });
}