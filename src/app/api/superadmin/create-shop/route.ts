import { db } from "@/db";
import { admin_supabase } from "@/util/supabase";
import { 
  ShopSync_Shops, 
  ShopSync_Users, 
  ShopSync_Managers 
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      shopName,
      shopLocation,
      managerName,
      managerEmail,
      managerPassword,
      managerLocation
    } = body;

    console.log("Creating shop:", { shopName, managerEmail });

    // Validate required fields
    if (!shopName || !shopLocation || !managerName || !managerEmail || !managerPassword) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if shop name already exists
    const existingShop = await db
      .select()
      .from(ShopSync_Shops)
      .where(eq(ShopSync_Shops.name, shopName));

    if (existingShop.length > 0) {
      return NextResponse.json({ error: "Shop name already exists" }, { status: 400 });
    }

    // Check if manager email already exists
    const existingManager = await db
      .select()
      .from(ShopSync_Users)
      .where(eq(ShopSync_Users.email, managerEmail));

    if (existingManager.length > 0) {
      return NextResponse.json({ error: "Manager email already exists" }, { status: 400 });
    }

    // Create manager in Supabase Auth
    const { data: authData, error: authError } = await admin_supabase.auth.admin.createUser({
      email: managerEmail,
      password: managerPassword,
      email_confirm: true
    });

    if (authError) {
      console.error("Supabase auth error:", authError);
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const managerId = authData.user.id;

    // Create shop
    const [newShop] = await db
      .insert(ShopSync_Shops)
      .values({
        name: shopName,
        location: shopLocation,
        createdAt: new Date(),
      })
      .returning({ shopId: ShopSync_Shops.id });

    // Create manager user
    await db.insert(ShopSync_Users).values({
      authid: managerId,
      username: managerName,
      email: managerEmail,
      role: "manager",
      homeLoc: managerLocation || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Assign manager to shop
    await db.insert(ShopSync_Managers).values({
      authid: managerId,
      shopId: newShop.shopId,
      createdAt: new Date(),
    });

    return NextResponse.json({ 
      message: "Shop and manager created successfully",
      shopId: newShop.shopId 
    });

  } catch (error) {
    console.error("Error creating shop:", error);
    
    // Cleanup on error
    if (body?.managerEmail) {
      try {
        const { data: userData } = await admin_supabase.auth.admin.listUsers();
        const userToDelete = userData.users.find(u => u.email === body.managerEmail);
        if (userToDelete) {
          await admin_supabase.auth.admin.deleteUser(userToDelete.id);
        }
      } catch (cleanupError) {
        console.error("Cleanup error:", cleanupError);
      }
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}