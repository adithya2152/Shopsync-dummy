
ALTER TABLE "ShopSync_PlatformSettings" ADD COLUMN "key" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "ShopSync_PlatformSettings" ADD COLUMN "value" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "ShopSync_PlatformSettings" DROP COLUMN "platform_fee";--> statement-breakpoint
ALTER TABLE "ShopSync_PlatformSettings" DROP COLUMN "delivery_charge_per_km";--> statement-breakpoint
ALTER TABLE "ShopSync_PlatformSettings" DROP COLUMN "tax_rate_percent";--> statement-breakpoint
ALTER TABLE "ShopSync_PlatformSettings" DROP COLUMN "is_maintenance_mode";--> statement-breakpoint
ALTER TABLE "ShopSync_PlatformSettings" DROP COLUMN "support_email";--> statement-breakpoint
ALTER TABLE "ShopSync_PlatformSettings" DROP COLUMN "support_phone";