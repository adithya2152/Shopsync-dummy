import { admin_supabase } from "@/util/supabase";
import { NextRequest } from "next/server";

import { addInventory } from "@/db";
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const productStr = formData.get("product") as string;
    const shopIdStr = formData.get("shopId") as string;
    const file = formData.get("image") as File | null;

    const product = JSON.parse(productStr);
    const shopId = parseInt(shopIdStr);

    console.log("🔐 Received Add Inventory Request:", {
      product,
      shopId,
      fileName: file?.name,
      fileType: file?.type,
    });
    // Validate inputs
    if (!product || !shopId || !file) {
      console.error("❌ Missing required fields in request");
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 }
      );
    }

    const filePath = `shopID-${shopId}/Product-${product.name}`;

    // Upload the file
    const { data: uploadData, error: uploadError } =
      await admin_supabase.storage.from("products").upload(filePath, file, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      console.error("❌ Upload Error:", uploadError);
      return new Response(JSON.stringify({ error: "Upload failed" }), {
        status: 500,
      });
    }

    console.log("✅ Upload success:", uploadData);

    // Generate public URL
    const publicUrlRes = admin_supabase.storage
      .from("products")
      .getPublicUrl(filePath);

    console.log("🌐 Public URL Response:", publicUrlRes);

    const publicUrl = publicUrlRes?.data?.publicUrl;

    if (!publicUrl) {
      console.error("❌ Public URL missing or invalid");
      return new Response(
        JSON.stringify({ error: "Failed to generate public URL" }),
        { status: 500 }
      );
    }

    // ✅ Add to DB
    const addInventoryResult = await addInventory(shopId, {
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      mnf_date: product.mnf_date ? new Date(product.mnf_date) : undefined,
      exp_date: product.exp_date ? new Date(product.exp_date) : undefined,
      categoryId: product.categoryId,
      imgPath: publicUrl,
    });

    if (addInventoryResult?.error) {
      console.error("❌ DB Insertion Failed:", addInventoryResult.error);
      return new Response(
        JSON.stringify({ error: "Failed to add inventory item" }),
        { status: 500 }
      );
    }

    console.log("✅ Inventory item added successfully:", addInventoryResult);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error("❌ API Error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}
