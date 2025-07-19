import { NextResponse } from "next/server";
import { db, getProductsByIds } from "@/db";
import { ShopSync_Coupons } from "@/db/schema";
import { eq } from "drizzle-orm";
import { and } from "drizzle-orm";

export async function POST(req: Request) {

  const { cart, coupon, shopId}: {cart: unknown, coupon: string, shopId: number} = await req.json();

  if (!Array.isArray(cart)) {
    return NextResponse.json({ error: "Invalid cart format" }, { status: 400 });
  }

  const productIds = cart.map((item) => item.id);
  const { data: products, error } = await getProductsByIds(productIds);
  if (error) {
    return NextResponse.json({ error: error }, { status: 500 });
  }

  const enrichedCart = cart.map((item) => {
    const product = products.find((p) => p.id === item.id);
    const numericPrice = parseFloat(product?.price.toString() || "0");
    const salePrice = product?.discount ? numericPrice - (numericPrice * parseFloat(product.discount) / 100) : numericPrice;
    return {
      ...item,
      name: product?.name ?? "Unknown",
      price: salePrice
    };
  });


  const subtotal = enrichedCart.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0
  );


  let discountAmount = 0;
  if (coupon) {
    const couponDetails = await db
      .select()
      .from(ShopSync_Coupons)
      .where(and(
        eq(ShopSync_Coupons.code, coupon),
        eq(ShopSync_Coupons.shopId, shopId)
      ))
      .limit(1);
    
    if (couponDetails.length === 0) {
      const otherShopExists = await db
        .select()
        .from(ShopSync_Coupons)
        .where(eq(ShopSync_Coupons.code, coupon))
        .limit(1);
      if (otherShopExists.length > 0) {
        return NextResponse.json({ errorType: "coupon", error: "Coupon is not valid for this shop" }, { status: 400 });
      }
      return NextResponse.json({ errorType: "coupon", error: "Invalid coupon code" }, { status: 400 });
    }

    const couponData = couponDetails[0];
    if (couponData.uses >= couponData.maxUses) {
      return NextResponse.json({ errorType: "coupon", error: "Coupon has reached its maximum uses" }, { status: 400 });
    }
    
    if (subtotal < couponData.minAmount) {
      return NextResponse.json({ errorType: "coupon", error: `Minimum spend of ${couponData.minAmount} required to use this coupon` }, { status: 400 });
    }

    if (couponData.discountType === "Percentage") {
      discountAmount = (subtotal * (parseFloat(couponData.discountValue) / 100));
    }
    else if (couponData.discountType === "Flat") {
      discountAmount = parseFloat(couponData.discountValue);
    }

    if (discountAmount > subtotal) {
      discountAmount = subtotal;
    }
    console.log(`Coupon applied: ${couponData.code}, Discount Amount: ₹${discountAmount.toFixed(2)}`);
  }
  const platformFees = 10;
  const total = subtotal + platformFees - discountAmount;

  return NextResponse.json({
    cart: enrichedCart,
    subtotal,
    platformFees,
    total,
    discountAmount
  });
}
