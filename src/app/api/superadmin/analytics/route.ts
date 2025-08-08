import { db } from "@/db";
import { 
  ShopSync_Orders, 
  ShopSync_Users, 
  ShopSync_Shops,
  ShopSync_Products 
} from "@/db/schema";
import { count, sum, sql, gte, and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Overall platform statistics
    const [
      totalUsers,
      totalShops,
      totalProducts,
      monthlyRevenue,
      lastMonthRevenue,
      monthlyOrders,
      lastMonthOrders
    ] = await Promise.all([
      // Total users
      db.select({ count: count() }).from(ShopSync_Users),
      
      // Total shops
      db.select({ count: count() }).from(ShopSync_Shops),
      
      // Total products
      db.select({ count: count() }).from(ShopSync_Products),
      
      // This month's revenue
      db
        .select({ revenue: sum(ShopSync_Orders.totalAmount) })
        .from(ShopSync_Orders)
        .where(
          and(
            gte(ShopSync_Orders.createdAt, startOfMonth),
            eq(ShopSync_Orders.status, "Completed")
          )
        ),
      
      // Last month's revenue
      db
        .select({ revenue: sum(ShopSync_Orders.totalAmount) })
        .from(ShopSync_Orders)
        .where(
          and(
            gte(ShopSync_Orders.createdAt, startOfLastMonth),
            sql`${ShopSync_Orders.createdAt} <= ${endOfLastMonth}`,
            eq(ShopSync_Orders.status, "Completed")
          )
        ),
      
      // This month's orders
      db
        .select({ count: count() })
        .from(ShopSync_Orders)
        .where(gte(ShopSync_Orders.createdAt, startOfMonth)),
      
      // Last month's orders
      db
        .select({ count: count() })
        .from(ShopSync_Orders)
        .where(
          and(
            gte(ShopSync_Orders.createdAt, startOfLastMonth),
            sql`${ShopSync_Orders.createdAt} <= ${endOfLastMonth}`
          )
        )
    ]);

    // Calculate growth percentages
    const currentRevenue = parseFloat(monthlyRevenue[0]?.revenue || "0");
    const previousRevenue = parseFloat(lastMonthRevenue[0]?.revenue || "0");
    const revenueGrowth = previousRevenue > 0 
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
      : 0;

    const currentOrders = monthlyOrders[0]?.count || 0;
    const previousOrders = lastMonthOrders[0]?.count || 0;
    const ordersGrowth = previousOrders > 0 
      ? ((currentOrders - previousOrders) / previousOrders) * 100 
      : 0;

    // Get monthly sales data for the last 6 months
    const salesData = await db
      .select({
        month: sql`EXTRACT(MONTH FROM ${ShopSync_Orders.createdAt})`,
        year: sql`EXTRACT(YEAR FROM ${ShopSync_Orders.createdAt})`,
        revenue: sum(ShopSync_Orders.totalAmount),
      })
      .from(ShopSync_Orders)
      .where(
        and(
          gte(ShopSync_Orders.createdAt, new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000)),
          eq(ShopSync_Orders.status, "Completed")
        )
      )
      .groupBy(
        sql`EXTRACT(MONTH FROM ${ShopSync_Orders.createdAt})`,
        sql`EXTRACT(YEAR FROM ${ShopSync_Orders.createdAt})`
      )
      .orderBy(
        sql`EXTRACT(YEAR FROM ${ShopSync_Orders.createdAt})`,
        sql`EXTRACT(MONTH FROM ${ShopSync_Orders.createdAt})`
      );

    return NextResponse.json({
      overview: {
        totalUsers: totalUsers[0]?.count || 0,
        totalShops: totalShops[0]?.count || 0,
        totalProducts: totalProducts[0]?.count || 0,
        monthlyRevenue: currentRevenue,
        revenueGrowth,
        monthlyOrders: currentOrders,
        ordersGrowth
      },
      salesData: salesData.map(item => ({
        month: `${item.year}-${String(item.month).padStart(2, '0')}`,
        revenue: parseFloat(item.revenue || "0")
      }))
    });

  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}