import { admin_supabase } from "@/util/supabase";
import { db } from "@/db";
import { 
  ShopSync_Users, 
  ShopSync_Managers, 
  ShopSync_ProductHeads, 
  ShopSync_DeliveryAssistants,
  ShopSync_ProductHead_Shops 
} from "@/db/schema";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      username, 
      email, 
      password, 
      role, 
      shopIds = [], 
      homeLoc 
    } = body;

    console.log("Creating employee:", { username, email, role, shopIds });

    // Validate required fields
    if (!username || !email || !password || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await admin_supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError) {
      console.error("Supabase auth error:", authError);
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const userId = authData.user.id;

    // Insert user into database
    await db.insert(ShopSync_Users).values({
      authid: userId,
      username,
      email,
      role,
      homeLoc: homeLoc || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Handle role-specific assignments
    if (role === "manager" && shopIds.length > 0) {
      for (const shopId of shopIds) {
        await db.insert(ShopSync_Managers).values({
          authid: userId,
          shopId: parseInt(shopId),
          createdAt: new Date(),
        });
      }
    } else if (role === "producthead") {
      // Create product head record
      await db.insert(ShopSync_ProductHeads).values({
        authid: userId,
        createdAt: new Date(),
      });

      // Assign to shops if provided
      if (shopIds.length > 0) {
        for (const shopId of shopIds) {
          await db.insert(ShopSync_ProductHead_Shops).values({
            productHeadId: userId,
            shopId: parseInt(shopId),
          });
        }
      }
    } else if (role === "deliveryassistant" && shopIds.length > 0) {
      await db.insert(ShopSync_DeliveryAssistants).values({
        authid: userId,
        shopId: parseInt(shopIds[0]), // Delivery assistant assigned to one shop
        createdAt: new Date(),
      });
    }

    return NextResponse.json({ 
      message: "Employee created successfully",
      userId 
    });

  } catch (error) {
    console.error("Error creating employee:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}