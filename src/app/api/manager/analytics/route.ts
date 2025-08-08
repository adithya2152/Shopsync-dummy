import { db } from "@/db";
import { 
  ShopSync_Orders, 
  ShopSync_OrderItems, 
  ShopSync_Products, 
  ShopSync_Managers,
  ShopSync_Users 
} from "@/db/schema";
import { eq, sum, count, desc, gte, and, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const cookie = req.cookies.get("user");
    if (!cookie) {
      return NextResponse.json({ error: "No user cookie found" }, { status: 401 });
    }

    const decoded = decodeURIComponent(cookie.value);
    const { id } = JSON.parse(decoded);

    // Get manager's shops
    const managedShops = await db
      .select({ shopId: ShopSync_Managers.shopId })
      .from(ShopSync_Managers)
      .where(eq(ShopSync_Managers.authid, id));

    if (managedShops.length === 0) {
      return NextResponse.json({ error: "No shops managed" }, { status: 404 });
    }

    const shopIds = managedShops.map(s => s.shopId);
    const period = req.nextUrl.searchParams.get("period") || "monthly";

    // Calculate date ranges
    const now = new Date();
    let startDate: Date;
    let previousStartDate: Date;

    switch (period) {
      case "daily":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        previousStartDate = new Date(startDate);
        previousStartDate.setDate(previousStartDate.getDate() - 1);
        break;
      case "weekly":
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        previousStartDate = new Date(startDate);
        previousStartDate.setDate(previousStartDate.getDate() - 7);
        break;
      case "monthly":
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        previousStartDate = new Date(startDate);
        previousStartDate.setMonth(previousStartDate.getMonth() - 1);
        break;
    }

    // Current period analytics
    const currentAnalytics = await db
      .select({
        totalRevenue: sum(ShopSync_Orders.totalAmount),
        totalOrders: count(ShopSync_Orders.id),
      })
      .from(ShopSync_Orders)
      .where(
        and(
          sql`${ShopSync_Orders.shopId} = ANY(${shopIds})`,
          gte(ShopSync_Orders.createdAt, startDate),
          eq(ShopSync_Orders.status, "Completed")
        )
      );

    // Previous period analytics for comparison
    const previousAnalytics = await db
      .select({
        totalRevenue: sum(ShopSync_Orders.totalAmount),
        totalOrders: count(ShopSync_Orders.id),
      })
      .from(ShopSync_Orders)
      .where(
        and(
          sql`${ShopSync_Orders.shopId} = ANY(${shopIds})`,
          gte(ShopSync_Orders.createdAt, previousStartDate),
          sql`${ShopSync_Orders.createdAt} < ${startDate}`,
          eq(ShopSync_Orders.status, "Completed")
        )
      );

    const currentRevenue = parseFloat(currentAnalytics[0]?.totalRevenue || "0");
    const currentOrders = currentAnalytics[0]?.totalOrders || 0;
    const previousRevenue = parseFloat(previousAnalytics[0]?.totalRevenue || "0");
    const previousOrders = previousAnalytics[0]?.totalOrders || 0;

    // Calculate percentage changes
    const revenueChange = previousRevenue > 0 
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
      : 0;
    const ordersChange = previousOrders > 0 
      ? ((currentOrders - previousOrders) / previousOrders) * 100 
      : 0;

    // Calculate average order value
    const currentAOV = currentOrders > 0 ? currentRevenue / currentOrders : 0;
    const previousAOV = previousOrders > 0 ? previousRevenue / previousOrders : 0;
    const aovChange = previousAOV > 0 
      ? ((currentAOV - previousAOV) / previousAOV) * 100 
      : 0;

    // Get sales data for chart
    let salesData;
    if (period === "daily") {
      // Last 7 days
      salesData = await db
        .select({
          date: sql`DATE(${ShopSync_Orders.createdAt})`,
          revenue: sum(ShopSync_Orders.totalAmount),
        })
        .from(ShopSync_Orders)
        .where(
          and(
            sql`${ShopSync_Orders.shopId} = ANY(${shopIds})`,
            gte(ShopSync_Orders.createdAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
            eq(ShopSync_Orders.status, "Completed")
          )
        )
        .groupBy(sql`DATE(${ShopSync_Orders.createdAt})`)
        .orderBy(sql`DATE(${ShopSync_Orders.createdAt})`);
    } else if (period === "weekly") {
      // Last 4 weeks
      salesData = await db
        .select({
          week: sql`EXTRACT(WEEK FROM ${ShopSync_Orders.createdAt})`,
          revenue: sum(ShopSync_Orders.totalAmount),
        })
        .from(ShopSync_Orders)
        .where(
          and(
            sql`${ShopSync_Orders.shopId} = ANY(${shopIds})`,
            gte(ShopSync_Orders.createdAt, new Date(Date.now() - 28 * 24 * 60 * 60 * 1000)),
            eq(ShopSync_Orders.status, "Completed")
          )
        )
        .groupBy(sql`EXTRACT(WEEK FROM ${ShopSync_Orders.createdAt})`)
        .orderBy(sql`EXTRACT(WEEK FROM ${ShopSync_Orders.createdAt})`);
    } else {
      // Last 6 months
      salesData = await db
        .select({
          month: sql`EXTRACT(MONTH FROM ${ShopSync_Orders.createdAt})`,
          revenue: sum(ShopSync_Orders.totalAmount),
        })
        .from(ShopSync_Orders)
        .where(
          and(
            sql`${ShopSync_Orders.shopId} = ANY(${shopIds})`,
            gte(ShopSync_Orders.createdAt, new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000)),
            eq(ShopSync_Orders.status, "Completed")
          )
        )
        .groupBy(sql`EXTRACT(MONTH FROM ${ShopSync_Orders.createdAt})`)
        .orderBy(sql`EXTRACT(MONTH FROM ${ShopSync_Orders.createdAt})`);
    }

    return NextResponse.json({
      revenue: {
        current: currentRevenue,
        change: revenueChange,
        changeType: revenueChange >= 0 ? "increase" : "decrease"
      },
      orders: {
        current: currentOrders,
        change: ordersChange,
        changeType: ordersChange >= 0 ? "increase" : "decrease"
      },
      aov: {
        current: currentAOV,
        change: aovChange,
        changeType: aovChange >= 0 ? "increase" : "decrease"
      },
      salesData: salesData.map(item => ({
        label: item.date || item.week || item.month,
        value: parseFloat(item.revenue || "0")
      }))
    });

  } catch (error) {
    console.error("Analytics API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}