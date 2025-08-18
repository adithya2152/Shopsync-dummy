 

import { admin_supabase } from "@/util/supabase";
import { NextRequest, NextResponse } from "next/server";
 
import { updateInventory, getProductsByIds } from "@/db"; 
 

export async function PUT(req: NextRequest) {
    try {
        const formData = await req.formData();
        const productStr = formData.get("product") as string;
        const shopIdStr = formData.get("shopId") as string;
        const file = formData.get("image") as File | null;

        if (!productStr || !shopIdStr) {
            return NextResponse.json({ error: "Missing product data or shop ID" }, { status: 400 });
        }

        const product = JSON.parse(productStr);
        const shopId = parseInt(shopIdStr);

        if (!product.id) {
            return NextResponse.json({ error: "Product ID is required for updates" }, { status: 400 });
        }

        
        const { data: originalProducts, error: fetchError } = await getProductsByIds([product.id]);
        
        if (fetchError) {
            return NextResponse.json({ error: "Failed to retrieve original product data." }, { status: 500 });
        }
        if (originalProducts.length === 0) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }
        
        const originalProduct = originalProducts[0];
        const oldName = originalProduct.name;

        
        const hasNameChanged = oldName !== product.name;

      
        if (hasNameChanged) {
            console.log(`📂 Product name changed from "${oldName}" to "${product.name}". Deleting old file.`);
            const oldFilePath = `shopID-${shopId}/Product-${oldName}`;
            
            const { error: deleteError } = await admin_supabase.storage
                .from("products")
                .remove([oldFilePath]);

            if (deleteError && deleteError.message !== 'The resource was not found') {
                console.error("❌ Error deleting old file:", deleteError);
                return NextResponse.json({ error: "Could not remove the old image file." }, { status: 500 });
            }
            console.log("🗑️ Old file deleted successfully.");
        }

        // 4. Handle the file upload (if a new file is provided).
        if (file) {
            const newFilePath = `shopID-${shopId}/Product-${product.name}`;
            const { error: uploadError } = await admin_supabase.storage
                .from("products")
                .upload(newFilePath, file, { upsert: true });

            if (uploadError) {
                console.error("❌ Error uploading new file:", uploadError);
                return NextResponse.json({ error: "Error uploading file" }, { status: 500 });
            }

            const { data: urlData } = admin_supabase.storage.from("products").getPublicUrl(newFilePath);
            product.imgPath = urlData.publicUrl;

        } else if (hasNameChanged) {
            // Update imgPath if only the name changed (no new file).
            const newFilePath = `shopID-${shopId}/Product-${product.name}`;
            const { data: urlData } = admin_supabase.storage.from("products").getPublicUrl(newFilePath);
            product.imgPath = urlData.publicUrl;
        }

        // 5. Finally, update the product details in the database.
        const res = await updateInventory(shopId, product);
        
        if (res?.error) {
            console.error("❌ Error in updateInventory call:", res.error);
            return NextResponse.json({ error: res.error }, { status: 500 });
        }

        console.log("✅ Inventory updated successfully for product ID:", product.id);
        return NextResponse.json(res.data, { status: 200 });

    } catch (error) {
        console.error("❌ Unhandled error in PUT route:", error);
        if (error instanceof SyntaxError) {
            return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
        }
        return NextResponse.json({ error: "An internal server error occurred" }, { status: 500 });
    }
}