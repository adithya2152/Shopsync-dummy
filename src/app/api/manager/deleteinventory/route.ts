import { admin_supabase } from "@/util/supabase";
import { getProductsByIds, removeInventory } from "@/db";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const productIdStr = searchParams.get("productId");
  const shopIdStr = searchParams.get("shopId");

  if (!productIdStr || !shopIdStr) {
    return NextResponse.json(
      { error: "Missing productId or shopId" },
      { status: 400 }
    );
  }
  
  const productId = parseInt(productIdStr, 10);
  const shopId = parseInt(shopIdStr, 10);

  if (isNaN(productId) || isNaN(shopId)) {
    return NextResponse.json(
      { error: "Invalid productId or shopId format" },
      { status: 400 }
    );
  }

  try {
     
    const { data: originalProducts, error: fetchError } =
      await getProductsByIds([productId]);

    if (fetchError) {
      return NextResponse.json(
        { error: "Failed to retrieve product data." },
        { status: 500 }
      );
    }
    if (originalProducts.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const originalProduct = originalProducts[0];

     
    if (originalProduct.shopId !== shopId) {
        return NextResponse.json({ error: "Forbidden: You do not have permission to delete this product." }, { status: 403 });
    }

    const oldName = originalProduct.name;
    const oldFilePath = `shopID-${shopId}/Product-${oldName}`;
    
 
    const { error: deleteError } = await admin_supabase.storage
      .from("products")
      .remove([oldFilePath]);

    if (deleteError && deleteError.message !== "The resource was not found") {
      console.error("❌ Error deleting storage file:", deleteError);
      return NextResponse.json(
        { error: "Could not remove the image file from storage." },
        { status: 500 }
      );
    }
    console.log("🗑️ Storage file deleted (or did not exist).");

     
    await removeInventory(shopId, productId);

    return NextResponse.json(
      { message: "Product removed successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error removing inventory:", error);
    return NextResponse.json(
      { error: "Failed to remove inventory" },
      { status: 500 }
    );
  }
}