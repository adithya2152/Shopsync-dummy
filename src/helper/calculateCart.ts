import { db, getProductsByIds } from "@/db";
import { ShopSync_Coupons, ShopSync_PlatformSettings, ShopSync_Shops } from "@/db/schema";
import { eq, and } from "drizzle-orm";

interface CartItem {
  id: number;
  quantity: number;
  stock: number;
}

interface EnrichedCartItem extends CartItem {
  name: string;
  price: number;
  stock: number;
}

interface CalculationResult {
  cart?: EnrichedCartItem[];
  subtotal?: number;
  platformFees?: number;
  total?: number;
  discountAmount?: number;
  error?: string;
  errorType?: "coupon" | "cart" | "database";
  status?: number;
  deliveryCharges?: number;
  tax?: number;

}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  // Earth's mean radius in kilometers.
  const R = 6371; 

  // Helper function to convert degrees to radians.
  const toRadians = (degree: number): number => {
      return degree * (Math.PI / 180);
  };

  // Convert latitude and longitude from degrees to radians.
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const radLat1 = toRadians(lat1);
  const radLat2 = toRadians(lat2);

  // Apply the Haversine formula.
  // a is the square of half the chord length between the points.
  const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(radLat1) * Math.cos(radLat2) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

  // c is the angular distance in radians.
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // d is the final distance in kilometers.
  const d = R * c;

  return d;
}


export async function calculateCartTotals(
  cart: unknown,
  shopId: number,
  homeLoc: { latitude: number; longitude: number },
  coupon?: string
): Promise<CalculationResult> {
  if (!Array.isArray(cart)) {
    return { error: "Invalid cart format", errorType: "cart", status: 400 };
  }

  const productIds = (cart as CartItem[]).map((item) => item.id);
  const { data: products, error } = await getProductsByIds(productIds);
  if (error) {
    return { error: error, errorType: "database", status: 500 };
  }

  const enrichedCart = (cart as CartItem[]).map((item) => {
    const product = products.find((p) => p.id === item.id);
    const numericPrice = parseFloat(product?.price.toString() || "0");
    const salePrice = product?.discount
      ? numericPrice - (numericPrice * parseFloat(product.discount) / 100)
      : numericPrice;
    return {
      ...item,
      name: product?.name ?? "Unknown",
      price: salePrice,
      stock: product?.stock || 0,
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
      .where(
        and(
          eq(ShopSync_Coupons.code, coupon),
          eq(ShopSync_Coupons.shopId, shopId)
        )
      )
      .limit(1);

    if (couponDetails.length === 0) {
      const otherShopExists = await db
        .select()
        .from(ShopSync_Coupons)
        .where(eq(ShopSync_Coupons.code, coupon))
        .limit(1);
      if (otherShopExists.length > 0) {
        return {
          error: "Coupon is not valid for this shop",
          errorType: "coupon",
          status: 400,
        };
      }
      return {
        error: "Invalid coupon code",
        errorType: "coupon",
        status: 400,
      };
    }

    const couponData = couponDetails[0];
    if (couponData.uses >= couponData.maxUses) {
      return {
        error: "Coupon has reached its maximum uses",
        errorType: "coupon",
        status: 400,
      };
    }

    if (subtotal < parseFloat(couponData.minAmount)) {
      return {
        error: `Minimum spend of ${couponData.minAmount} required to use this coupon`,
        errorType: "coupon",
        status: 400,
      };
    }

    if (couponData.discountType === "Percentage") {
      discountAmount = subtotal * (parseFloat(couponData.discountValue) / 100);
    } else if (couponData.discountType === "Flat") {
      discountAmount = parseFloat(couponData.discountValue);
    }

    if (discountAmount > subtotal) {
      discountAmount = subtotal;
    }
  }

  const platformSettings = await db
  .select()
  .from(ShopSync_PlatformSettings)

  const platformFees = parseFloat(platformSettings.find(
    (setting) => setting.key === "platform_fee"
  )?.value || "0");


  const delivery_charge_per_km = parseFloat(platformSettings.find(
    (setting) => setting.key === "del_charge_per_km"
  )?.value || "0");

  const tax_rate_percent = parseFloat(platformSettings.find(
    (setting) => setting.key === "tax_rate_percent"
  )?.value || "0");

  const maxDist = parseFloat(platformSettings.find(
    (setting) => setting.key === "max_del_distance"
  )?.value || "0");


  const shopRow = await db
    .select()
    .from(ShopSync_Shops)
    .where(eq(ShopSync_Shops.id, shopId))

  const location = shopRow[0].location as { latitude: number; longitude: number };

  const shopLat = location.latitude;
  const shopLng = location.longitude;
  const homeLat = homeLoc.latitude;
  const homeLng = homeLoc.longitude;

  const kms = calculateDistance(shopLat, shopLng, homeLat, homeLng);


  if (maxDist > 0 && kms > maxDist) {
    return {
      error: `Delivery not available beyond ${maxDist} km`,
      errorType: "cart",
      status: 400,
    }
  }
  const deliveryCharges = kms * delivery_charge_per_km;


  let total = subtotal + platformFees + deliveryCharges - discountAmount;

  const tax = (total * tax_rate_percent) / 100;
  total += tax;


  return {
    cart: enrichedCart,
    subtotal,
    platformFees,
    deliveryCharges,
    tax,
    total,
    discountAmount,
  };
}