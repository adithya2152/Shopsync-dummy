import { NextResponse } from "next/server";
import { getProductsByIds } from "@/db";

export async function POST(req: Request) {

  const { cart} = await req.json();

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
  const platformFees = 10;
  const total = subtotal + platformFees;

  return NextResponse.json({
    cart: enrichedCart,
    subtotal,
    platformFees,
    total,
  });
}
