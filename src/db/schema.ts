import { sql } from "drizzle-orm";
 
import { serial, uuid, pgTable, varchar, json, integer, timestamp, numeric , date ,text, primaryKey, boolean } from "drizzle-orm/pg-core";

/** ✅ Users Table (Stores all user types) */
export const ShopSync_Users = pgTable("ShopSync_Users", {
    id: serial("id").primaryKey(),
    authid: uuid("authid").unique().notNull(),
    username: varchar("username").notNull(),
    email: varchar("email").notNull(),
    role: varchar("role").notNull(), // "Customer", "Manager", "ProductHead", "DeliveryAssistant"
    homeLoc: json("homeLoc"), // Stores { latitude, longitude , houseNo , street Address ,AdressLine2 , city ,  pincode }
    homeLoc2: json("homeLoc2"), // Stores { latitude, longitude , houseNo , street Address ,AdressLine2 , city ,  pincode }
    Phone: varchar("Phone"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow(),
});

/** ✅ Shops Table */
export const ShopSync_Shops = pgTable("ShopSync_Shops", {
    id: serial("id").primaryKey(),
    name: varchar("name").notNull(),
    location: json("location").notNull(), // { latitude, longitude , houseNo , street Address ,AdressLine2 , city ,  pincode }
    createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/** ✅ Managers (Assigned to Shops) */
export const ShopSync_Managers = pgTable("ShopSync_Managers", {
    authid: uuid("authid").notNull().references(() => ShopSync_Users.authid, { onDelete: "cascade" }),
    shopId: integer("shopId").notNull().references(() => ShopSync_Shops.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => {
    return {
        pk: primaryKey({
            columns: [table.authid, table.shopId],
            name: "ShopSync_Managers_pkey",  
        }),
    };
});

/** ✅ Product Heads (Assigned to Shops, Can Oversee Multiple Shops) */
export const ShopSync_ProductHeads = pgTable("ShopSync_ProductHeads", {
    id: serial("id").primaryKey(),
    authid: uuid("authid").unique().notNull().references(() => ShopSync_Users.authid, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/** ✅ ProductHead ↔ Shops (Many-to-Many) */
export const ShopSync_ProductHead_Shops = pgTable("ShopSync_ProductHead_Shops", {
    id: serial("id").primaryKey(),
    productHeadId: uuid("productHeadId").notNull().references(() => ShopSync_ProductHeads.authid, { onDelete: "cascade" }),
    shopId: integer("shopId").notNull().references(() => ShopSync_Shops.id, { onDelete: "cascade" }),
});

/** ✅ Delivery Assistants (Assigned to Shops) */
export const ShopSync_DeliveryAssistants = pgTable("ShopSync_DeliveryAssistants", {
    id: serial("id").primaryKey(),
    authid: uuid("authid").unique().notNull().references(() => ShopSync_Users.authid, { onDelete: "cascade" }),
    shopId: integer("shopId").notNull().references(() => ShopSync_Shops.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/** ✅ Product Categories Table */
export const ShopSync_Categories = pgTable("ShopSync_Categories", {
    id: serial("id").primaryKey(),
    name: varchar("name").unique().notNull(),
    imgPath: text("imgPath"),
    createdAt: timestamp("createdAt").defaultNow().notNull()
});

/** ✅ Products Table `ShopSync_Products` */
export const ShopSync_Products = pgTable("ShopSync_Products", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  description: varchar("description"),
  price: numeric("price").notNull(),
  stock: integer("stock").notNull(),
  mnf_date: date("mnf_date"),
  exp_date: date("exp_date"),
  categoryId: integer("categoryId").notNull().references(() => ShopSync_Categories.id, { onDelete: "cascade" }),
  shopId: integer("shopId").notNull().references(() => ShopSync_Shops.id, { onDelete: "cascade" }),
  imgPath: text("imgPath"), 
  discount: numeric("discount").default("0"), 
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});


/** ✅ Orders Table */
export const ShopSync_Orders = pgTable("ShopSync_Orders", {
    id: serial("id").primaryKey(),
    customerId: uuid("customerId").notNull().references(() => ShopSync_Users.authid, { onDelete: "cascade" }),
    shopId: integer("shopId").notNull().references(() => ShopSync_Shops.id, { onDelete: "cascade" }),
    deliveryAssistantId: uuid("deliveryAssistantId").references(() => ShopSync_DeliveryAssistants.authid, { onDelete: "set null" }),
    status: varchar("status").default("Pending").notNull(),
    estimatedDelivery: timestamp("estimatedDelivery"),
    actualDelivery: timestamp("actualDelivery"),
    DelLoc: json("DelLoc").notNull(), // Stores { latitude, longitude , houseNo , street Address ,AdressLine2 , city ,  pincode }
    totalAmount: numeric("totalAmount").notNull().default("0"), // Total amount for the order`
    paymentStatus: varchar("paymentStatus").default("Pending").notNull(), // "Pending", "Completed", "Failed"
    paymentMethod: varchar("paymentMethod").default("Cash").notNull(), // "Cash
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    d_rating: integer("d_rating"),
    plt_fee: numeric("plt_fee").default("0"),
    del_fee: numeric("del_fee").default("0"),
    tax: numeric("tax").default("0"),
    discount_amount: numeric("discount_amount").default("0"),

  });
  
export const ShopSync_OrderItems = pgTable("ShopSync_OrderItems", {
    id: serial("id").primaryKey(),
    orderId: integer("orderId").notNull().references(() => ShopSync_Orders.id, { onDelete: "cascade" }),
    productId: integer("productId").notNull().references(() => ShopSync_Products.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull(),
    price: numeric("price").notNull().default("0"), // Price at the time of order
    rating: integer("rating")
    });

export const ShopSync_Coupons = pgTable("ShopSync_Coupons", {
    id: serial("id").primaryKey(),
    shopId: integer("shopId").notNull().references(() => ShopSync_Shops.id, { onDelete: "cascade" }),
    name: varchar("name"),
    description: text("description"),
    public: boolean("public").default(true).notNull(), // If true, displayed 
    code: varchar("code").unique().notNull(),
    uses: integer("uses").default(0).notNull(), // Number of times this coupon has been used
    maxUses: integer("maxUses").default(1).notNull(), // Maximum times this coupon can be used
    discountType: varchar("discountType").notNull(), // "Percentage" or "Flat"
    discountValue: numeric("discountValue").notNull(),
    minAmount: numeric("minAmount").default("0").notNull() // Minimum order amount to apply this coupon
})

/** ✅ Analytics Table for Product Heads */
export const ShopSync_Analytics = pgTable("ShopSync_Analytics", {
    id: serial("id").primaryKey(),
    shopId: integer("shopId").notNull().references(() => ShopSync_Shops.id, { onDelete: "cascade" }),
    totalOrders: integer("totalOrders").default(sql`0`),  
    totalRevenue: numeric("totalRevenue").default(sql`0`),  
    topSellingProducts: json("topSellingProducts"), // Store product IDs
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});


// export const ShopSync_PlatformSettings = pgTable("ShopSync_PlatformSettings", {
//     id: serial("id").primaryKey().notNull(),
//     platform_fee: numeric("platform_fee", { precision: 10, scale: 2 }).default("0.00").notNull(),
//     delivery_charge_per_km: numeric("delivery_charge_per_km", { precision: 10, scale: 2 }).default("0.00").notNull(),
//     tax_rate_percent: numeric("tax_rate_percent", { precision: 5, scale: 2 }).default("0.00").notNull(),
//     is_maintenance_mode: boolean("is_maintenance_mode").default(false).notNull(),
//     support_email: varchar("support_email", { length: 255 }),
//     support_phone: varchar("support_phone", { length: 50 }),    
//     createdAt: timestamp("createdAt").defaultNow().notNull(),
//     updatedAt: timestamp("updatedAt").default(sql`now()`),
// });
 

export const ShopSync_PlatformSettings = pgTable("ShopSync_PlatformSettings", {
    id:serial("id").primaryKey().notNull(),
    key: varchar("key").notNull().unique(),
    value: varchar("value"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").default(sql`now()`),
})


//deploy
