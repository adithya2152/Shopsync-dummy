import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import dotenv from "dotenv";
import { and, eq, inArray, sql } from "drizzle-orm";
import {
  ShopSync_Categories,
  ShopSync_Managers,
  ShopSync_Products,
  ShopSync_Shops,
  ShopSync_Users,
} from "./schema";

dotenv.config();

const connectionString = process.env.NEXT_PUBLIC_SUPABASE_CONNECTION_STRING;

if (!connectionString) {
  throw new Error("❌ SUPABASE_CONNECTION_STRING is not defined");
}

const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client);

console.log("✅ Database initialized");

export async function CreateUser(
  username: string,
  email: string,
  uuid: string,
  loc: { latitude: number; longitude: number },
  role: string
) {
  try {
    const now = new Date();

    const existingUser = await db
      .select()
      .from(ShopSync_Users)
      .where(eq(ShopSync_Users.authid, uuid));

    if (existingUser.length > 0) {
      console.log("⚠️ User already exists:", uuid);
      return { error: "User already exists" };
    }

    await db.insert(ShopSync_Users).values({
      authid: uuid,
      username,
      email,
      role: role,
      homeLoc: loc,
      createdAt: now,
      updatedAt: now,
    });

    console.log("✅ User created successfully:", username);
    return { success: true };
  } catch (error) {
    console.error("❌ Error inserting user:", error);
    return { error: "Failed to insert user into database" };
  }
}

export async function RegisterShop(
  Shopname: string,
  loc: { latitude: number; longitude: number },
  Memail: string,
  Mauth: string,
  Mname: string,
  Mloc: { latitude: number; longitude: number }
) {
  try {
    const now = new Date();

    const existingShop = await db
      .select()
      .from(ShopSync_Shops)
      .where(eq(ShopSync_Shops.name, Shopname));

    if (existingShop.length > 0) {
      console.log("⚠️ Shop already exists:", Shopname);
      return { error: "Shop name already exists" };
    }

    const [newShop] = await db
      .insert(ShopSync_Shops)
      .values({
        name: Shopname,
        location: JSON.stringify(loc),
        createdAt: now,
      })
      .returning({ shopId: ShopSync_Shops.id });

    console.log(
      "✅ Shop Successfully Registered:",
      Shopname,
      "with ID:",
      newShop.shopId
    );

    const existingManager = await db
      .select()
      .from(ShopSync_Users)
      .where(eq(ShopSync_Users.email, Memail));

    if (existingManager.length > 0) {
      console.log(
        "⚠️ Manager email already registered for a different shop:",
        existingManager[0].authid,
        existingManager[0].username
      );
      await db
        .delete(ShopSync_Shops)
        .where(eq(ShopSync_Shops.id, newShop.shopId));
      console.log("🗑️ Registered shop deleted as manager registration failed");
      return {
        error: "Manager email already registered. Login to register new shop",
      };
    }

    await db.insert(ShopSync_Users).values({
      authid: Mauth,
      username: Mname,
      email: Memail,
      role: "manager",
      homeLoc: JSON.stringify(Mloc),
      createdAt: now,
      updatedAt: now,
    });

    await db.insert(ShopSync_Managers).values({
      authid: Mauth,
      shopId: newShop.shopId,
      createdAt: now,
    });

    console.log("✅ Manager registered successfully:", Mname);
    return { success: true, shopId: newShop.shopId };
  } catch (error) {
    console.error("❌ Error registering shop:", error);
    return { error: "Failed to register shop into database" };
  }
}

export async function getStoreIDs(managerAuthId: string) {
  try {
    const storeIDs = await db
      .select({
        id: ShopSync_Shops.id,
        name: ShopSync_Shops.name,
      })
      .from(ShopSync_Shops)
      .innerJoin(
        ShopSync_Managers,
        eq(ShopSync_Managers.shopId, ShopSync_Shops.id)
      )
      .where(eq(ShopSync_Managers.authid, managerAuthId)); // ✅ Filter by logged-in manager

    return storeIDs;
  } catch (error) {
    console.error("❌ Error fetching store IDs:", error);
    return [];
  }
}

export async function getInventory(shopId: number) {
  try {
    const inventory = await db
      .select()
      .from(ShopSync_Products)
      .where(eq(ShopSync_Products.shopId, shopId))
      .orderBy(
        ShopSync_Products.stock,
        ShopSync_Products.price,
        ShopSync_Products.mnf_date
      );

    if (inventory.length === 0) {
      console.log("⚠️ No inventory found for shop ID:", shopId);
      return [];
    }
    console.log("✅ Inventory fetched successfully for shop ID:", shopId);
    return inventory;
  } catch (error) {
    console.error("❌ Error fetching inventory:", error);
    return [];
  }
}

export async function getProductsByIds(productIds: number[]) {
  try {
    const products = await db
      .select({
        id: ShopSync_Products.id,
        name: ShopSync_Products.name,
        price: ShopSync_Products.price,
        shopId: ShopSync_Products.shopId,
        discount: ShopSync_Products.discount,
        stock: ShopSync_Products.stock,
      })
      .from(ShopSync_Products)
      .where(inArray(ShopSync_Products.id, productIds));

    if (products.length === 0) {
      console.log("⚠️ No products found for IDs:", productIds);
      return { data: [], error: null };
    }

    console.log("✅ Products fetched successfully for IDs:", productIds);
    return { data: products, error: null };
  } catch (error) {
    console.error("❌ Error fetching products:", error);
    return { data: [], error: "Failed to fetch products" };
  }
}

export async function getCategories() {
  try {
    const cat = await db
      .select({
        id: ShopSync_Categories.id,
        name: ShopSync_Categories.name,
        imgPath: ShopSync_Categories.imgPath,
      })
      .from(ShopSync_Categories)
      .orderBy(
        sql`
            CASE
                WHEN ${ShopSync_Categories.name} = 'Others' THEN 10
                ELSE 1
            END
        `,
        ShopSync_Categories.name // Sorts the rest of the categories alphabetically
      );

    if (cat.length === 0) {
      console.log("⚠️ No categories found");
      return [];
    }
    console.log("✅ Categories fetched successfully");
    return cat;
  } catch (error) {
    console.error("❌ Error fetching categories:", error);
    return [];
  }
}
export async function getShops() {
  try {
    const shops = await db
      .select({ id: ShopSync_Shops.id, name: ShopSync_Shops.name })
      .from(ShopSync_Shops)
      .orderBy(ShopSync_Shops.name);

    if (shops.length === 0) {
      console.log("⚠️ No shops found");
      return [];
    }
    console.log("✅ Shops fetched successfully");
    return shops;
  } catch (error) {
    console.error("❌ Error fetching shops:", error);
    return [];
  }
}

export async function addInventory(
  shopId: number,
  product: {
    name: string;
    description: string;
    price: number;
    stock: number;
    mnf_date?: Date;
    exp_date?: Date;
    categoryId: number;
    imgPath?: string;
  }
) {
  try {
    const existingProduct = await db
      .select()
      .from(ShopSync_Products)
      .where(
        and(
          eq(ShopSync_Products.name, product.name),
          eq(ShopSync_Products.shopId, shopId)
        )
      );
    if (existingProduct.length > 0) {
      console.log("⚠️ Product already exists in inventory:", product.name);
      return { error: "Product already exists in inventory" };
    }
    await db.insert(ShopSync_Products).values({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      stock: product.stock,
      categoryId: product.categoryId,
      shopId: shopId,
      imgPath: product.imgPath,
      mnf_date: product.mnf_date?.toISOString().split("T")[0],
      exp_date: product.exp_date?.toISOString().split("T")[0],
    });
  } catch (error) {
    console.error("❌ Error adding inventory:", error);
    return { error: "Failed to add inventory" };
  }
}

export async function updateDiscount(
  shopId: number,
  productId: number,
  discount: number
) {
  try {
    const existingProduct = await db
      .select()
      .from(ShopSync_Products)
      .where(
        and(
          eq(ShopSync_Products.id, productId),
          eq(ShopSync_Products.shopId, shopId)
        )
      );
    if (existingProduct.length === 0) {
      console.log("⚠️ Product not found in inventory:", productId);
      return { error: "Product not found in inventory" };
    }
    await db
      .update(ShopSync_Products)
      .set({ discount: discount.toString() })
      .where(
        and(
          eq(ShopSync_Products.id, productId),
          eq(ShopSync_Products.shopId, shopId)
        )
      );
  } catch (error) {
    console.error("❌ Error updating discount:", error);
    return { error: "Failed to update discount" };
  }
}

export async function removeDiscount(shopId: number, productId: number) {
  try {
    const existingProduct = await db
      .select()
      .from(ShopSync_Products)
      .where(
        and(
          eq(ShopSync_Products.id, productId),
          eq(ShopSync_Products.shopId, shopId)
        )
      );
    if (existingProduct.length === 0) {
      console.log("⚠️ Product not found in inventory:", productId);
      return { error: "Product not found in inventory" };
    }
    await db
      .update(ShopSync_Products)
      .set({ discount: "0" })
      .where(
        and(
          eq(ShopSync_Products.id, productId),
          eq(ShopSync_Products.shopId, shopId)
        )
      );
  } catch (error) {
    console.error("❌ Error removing discount:", error);
    return { error: "Failed to remove discount" };
  }
}

export async function updateInventory(
  shopId: number,
  product: {
    id: number;
    name?: string;
    description?: string;
    price?: number;
    stock?: number;
    mnf_date?: string;
    exp_date?: string;
    categoryId?: number;
    imgPath?: string;
  }
) {
  try {
    // This check is good, keep it.
    const checkProductId = await db
      .select({ id: ShopSync_Products.id }) // Only select the ID for efficiency
      .from(ShopSync_Products)
      .where(
        and(
          eq(ShopSync_Products.id, product.id),
          eq(ShopSync_Products.shopId, shopId)
        )
      );

    if (checkProductId.length === 0) {
      console.log("⚠️ Product not found in inventory:", product.id);
      return { error: "Product not found in inventory" };
    }

    // Create an object with only the fields to be updated.
    const updateData: Partial<typeof ShopSync_Products.$inferInsert> = {};

    if (product.name) updateData.name = product.name;
    if (product.description) updateData.description = product.description;
    if (product.price) updateData.price = product.price.toString();
    if (product.stock) updateData.stock = product.stock;
    if (product.categoryId) updateData.categoryId = product.categoryId;
    if (product.imgPath) updateData.imgPath = product.imgPath;

    // ✅ FIX: Handle date strings correctly
    if (product.mnf_date) {
      updateData.mnf_date = new Date(product.mnf_date)
        .toISOString()
        .split("T")[0];
    }
    if (product.exp_date) {
      updateData.exp_date = new Date(product.exp_date)
        .toISOString()
        .split("T")[0];
    }

    const updatedProduct = await db
      .update(ShopSync_Products)
      .set(updateData) // Use the dynamically created update object
      .where(
        and(
          eq(ShopSync_Products.id, product.id),
          eq(ShopSync_Products.shopId, shopId)
        )
      )
      .returning(); // Return the updated product data

    return { data: updatedProduct[0] };
  } catch (error) {
    console.error("❌ Error updating inventory:", error);
    return { error: "Failed to update inventory" };
  }
}

export async function removeInventory(shopId: number, productId: number) {
  try {
    const checkProductId = await db
      .select({ id: ShopSync_Products.id }) // Only select the ID for efficiency
      .from(ShopSync_Products)
      .where(
        and(
          eq(ShopSync_Products.id, productId),
          eq(ShopSync_Products.shopId, shopId)
        )
      );

    if (checkProductId.length === 0) {
      console.log("⚠️ Product not found in inventory:", productId);
      return { error: "Product not found in inventory" };
    }

    await db
      .delete(ShopSync_Products)
      .where(
        and(
          eq(ShopSync_Products.id, productId),
          eq(ShopSync_Products.shopId, shopId)
        )
      );
  } catch (error) {
    console.error("❌ Error removing inventory:", error);
    return { error: "Failed to remove inventory" };
  }
}
export { drizzle, client };
