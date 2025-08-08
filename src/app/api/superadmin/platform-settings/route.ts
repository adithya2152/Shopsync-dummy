import { db } from "@/db";
import { ShopSync_PlatformSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const settings = await db
      .select()
      .from(ShopSync_PlatformSettings);

    const settingsMap: Record<string, string> = {};
    settings.forEach(setting => {
      settingsMap[setting.key] = setting.value || "";
    });

    return NextResponse.json(settingsMap);
  } catch (error) {
    console.error("Error fetching platform settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { settings } = body;

    // Validate required settings
    const requiredSettings = [
      "platform_fee",
      "del_charge_per_km", 
      "tax_rate_percent",
      "max_del_distance",
      "support_email",
      "support_phone"
    ];

    for (const key of requiredSettings) {
      if (!(key in settings)) {
        return NextResponse.json({ error: `Missing setting: ${key}` }, { status: 400 });
      }
    }

    // Update or insert each setting
    for (const [key, value] of Object.entries(settings)) {
      await db
        .insert(ShopSync_PlatformSettings)
        .values({
          key,
          value: value as string,
          updatedAt: new Date()
        })
        .onConflictDoUpdate({
          target: ShopSync_PlatformSettings.key,
          set: {
            value: value as string,
            updatedAt: new Date()
          }
        });
    }

    return NextResponse.json({ message: "Settings updated successfully" });
  } catch (error) {
    console.error("Error updating platform settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}