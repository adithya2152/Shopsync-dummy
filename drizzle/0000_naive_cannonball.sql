CREATE TABLE "ShopSync_Analytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"shopId" integer NOT NULL,
	"totalOrders" integer DEFAULT 0,
	"totalRevenue" numeric DEFAULT 0,
	"topSellingProducts" json,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ShopSync_Categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ShopSync_Categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "ShopSync_Coupons" (
	"id" serial PRIMARY KEY NOT NULL,
	"shopId" integer NOT NULL,
	"name" varchar,
	"description" text,
	"public" boolean DEFAULT true NOT NULL,
	"code" varchar NOT NULL,
	"uses" integer DEFAULT 0 NOT NULL,
	"maxUses" integer DEFAULT 1 NOT NULL,
	"discountType" varchar NOT NULL,
	"discountValue" numeric NOT NULL,
	"minAmount" numeric DEFAULT '0' NOT NULL,
	CONSTRAINT "ShopSync_Coupons_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "ShopSync_DeliveryAssistants" (
	"id" serial PRIMARY KEY NOT NULL,
	"authid" uuid NOT NULL,
	"shopId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ShopSync_DeliveryAssistants_authid_unique" UNIQUE("authid")
);
--> statement-breakpoint
CREATE TABLE "ShopSync_Managers" (
	"authid" uuid NOT NULL,
	"shopId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ShopSync_Managers_pkey" PRIMARY KEY("authid","shopId")
);
--> statement-breakpoint
CREATE TABLE "ShopSync_OrderItems" (
	"id" serial PRIMARY KEY NOT NULL,
	"orderId" integer NOT NULL,
	"productId" integer NOT NULL,
	"quantity" integer NOT NULL,
	"price" numeric DEFAULT '0' NOT NULL,
	"rating" integer
);
--> statement-breakpoint
CREATE TABLE "ShopSync_Orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"customerId" uuid NOT NULL,
	"shopId" integer NOT NULL,
	"deliveryAssistantId" uuid,
	"status" varchar DEFAULT 'Pending' NOT NULL,
	"estimatedDelivery" timestamp,
	"actualDelivery" timestamp,
	"DelLoc" json NOT NULL,
	"totalAmount" numeric DEFAULT '0' NOT NULL,
	"paymentStatus" varchar DEFAULT 'Pending' NOT NULL,
	"paymentMethod" varchar DEFAULT 'Cash' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"d_rating" integer
);
--> statement-breakpoint
CREATE TABLE "ShopSync_PlatformSettings" (
	"id" serial PRIMARY KEY NOT NULL,
	"platform_fee" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"delivery_charge_per_km" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"tax_rate_percent" numeric(5, 2) DEFAULT '0.00' NOT NULL,
	"is_maintenance_mode" boolean DEFAULT false NOT NULL,
	"support_email" varchar(255),
	"support_phone" varchar(50),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ShopSync_ProductHead_Shops" (
	"id" serial PRIMARY KEY NOT NULL,
	"productHeadId" uuid NOT NULL,
	"shopId" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ShopSync_ProductHeads" (
	"id" serial PRIMARY KEY NOT NULL,
	"authid" uuid NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ShopSync_ProductHeads_authid_unique" UNIQUE("authid")
);
--> statement-breakpoint
CREATE TABLE "ShopSync_Products" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"description" varchar,
	"price" numeric NOT NULL,
	"stock" integer NOT NULL,
	"mnf_date" date,
	"exp_date" date,
	"categoryId" integer NOT NULL,
	"shopId" integer NOT NULL,
	"imgPath" text,
	"discount" numeric DEFAULT '0',
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ShopSync_Shops" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"location" json NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ShopSync_Users" (
	"id" serial PRIMARY KEY NOT NULL,
	"authid" uuid NOT NULL,
	"username" varchar NOT NULL,
	"email" varchar NOT NULL,
	"role" varchar NOT NULL,
	"homeLoc" json NOT NULL,
	"homeLoc2" json,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now(),
	CONSTRAINT "ShopSync_Users_authid_unique" UNIQUE("authid")
);
--> statement-breakpoint
ALTER TABLE "ShopSync_Analytics" ADD CONSTRAINT "ShopSync_Analytics_shopId_ShopSync_Shops_id_fk" FOREIGN KEY ("shopId") REFERENCES "public"."ShopSync_Shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ShopSync_Coupons" ADD CONSTRAINT "ShopSync_Coupons_shopId_ShopSync_Shops_id_fk" FOREIGN KEY ("shopId") REFERENCES "public"."ShopSync_Shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ShopSync_DeliveryAssistants" ADD CONSTRAINT "ShopSync_DeliveryAssistants_authid_ShopSync_Users_authid_fk" FOREIGN KEY ("authid") REFERENCES "public"."ShopSync_Users"("authid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ShopSync_DeliveryAssistants" ADD CONSTRAINT "ShopSync_DeliveryAssistants_shopId_ShopSync_Shops_id_fk" FOREIGN KEY ("shopId") REFERENCES "public"."ShopSync_Shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ShopSync_Managers" ADD CONSTRAINT "ShopSync_Managers_authid_ShopSync_Users_authid_fk" FOREIGN KEY ("authid") REFERENCES "public"."ShopSync_Users"("authid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ShopSync_Managers" ADD CONSTRAINT "ShopSync_Managers_shopId_ShopSync_Shops_id_fk" FOREIGN KEY ("shopId") REFERENCES "public"."ShopSync_Shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ShopSync_OrderItems" ADD CONSTRAINT "ShopSync_OrderItems_orderId_ShopSync_Orders_id_fk" FOREIGN KEY ("orderId") REFERENCES "public"."ShopSync_Orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ShopSync_OrderItems" ADD CONSTRAINT "ShopSync_OrderItems_productId_ShopSync_Products_id_fk" FOREIGN KEY ("productId") REFERENCES "public"."ShopSync_Products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ShopSync_Orders" ADD CONSTRAINT "ShopSync_Orders_customerId_ShopSync_Users_authid_fk" FOREIGN KEY ("customerId") REFERENCES "public"."ShopSync_Users"("authid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ShopSync_Orders" ADD CONSTRAINT "ShopSync_Orders_shopId_ShopSync_Shops_id_fk" FOREIGN KEY ("shopId") REFERENCES "public"."ShopSync_Shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ShopSync_Orders" ADD CONSTRAINT "ShopSync_Orders_deliveryAssistantId_ShopSync_DeliveryAssistants_authid_fk" FOREIGN KEY ("deliveryAssistantId") REFERENCES "public"."ShopSync_DeliveryAssistants"("authid") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ShopSync_ProductHead_Shops" ADD CONSTRAINT "ShopSync_ProductHead_Shops_productHeadId_ShopSync_ProductHeads_authid_fk" FOREIGN KEY ("productHeadId") REFERENCES "public"."ShopSync_ProductHeads"("authid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ShopSync_ProductHead_Shops" ADD CONSTRAINT "ShopSync_ProductHead_Shops_shopId_ShopSync_Shops_id_fk" FOREIGN KEY ("shopId") REFERENCES "public"."ShopSync_Shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ShopSync_ProductHeads" ADD CONSTRAINT "ShopSync_ProductHeads_authid_ShopSync_Users_authid_fk" FOREIGN KEY ("authid") REFERENCES "public"."ShopSync_Users"("authid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ShopSync_Products" ADD CONSTRAINT "ShopSync_Products_categoryId_ShopSync_Categories_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."ShopSync_Categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ShopSync_Products" ADD CONSTRAINT "ShopSync_Products_shopId_ShopSync_Shops_id_fk" FOREIGN KEY ("shopId") REFERENCES "public"."ShopSync_Shops"("id") ON DELETE cascade ON UPDATE no action;