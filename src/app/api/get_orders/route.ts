import { db } from "@/db";
import {
    ShopSync_Orders,
    ShopSync_OrderItems,
    ShopSync_Products,
    ShopSync_Shops,
    ShopSync_Users,
} from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

interface groupedOrder {
    id: number;
    status: string;
    createdAt: Date;
    estimatedDelivery: Date | null;
    actualDelivery: Date | null;
    d_rating: number | null;
    plt_fee: string | null;
    del_fee: string | null;
    tax: string | null;
    discount_amount: string | null;
    shop: {
        id: number | null;
        name: string | null;
    };
    items: {
        id: number;
        quantity: number | null; 
        price: number | null
        name: string | null; 
        rating: number | null;
    }[];
}

export async function GET(req: NextRequest) {
    const cookie = req.cookies.get("user");
    if (!cookie) {
        return NextResponse.json({ message: "No cookies found ", authenticated: false }, { status: 200 });
    }

    const decoded = decodeURIComponent(cookie.value);
    const { id, email } = JSON.parse(decoded);
    if (!id || !email) {
        return NextResponse.json({ error: "Missing id or email" }, { status: 400 });
    }

    const user = await db
        .select()
        .from(ShopSync_Users)
        .where(eq(ShopSync_Users.authid, id));

    if (user.length === 0) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rows = await db
        .select({
            orderId: ShopSync_Orders.id,
            status: ShopSync_Orders.status,
            createdAt: ShopSync_Orders.createdAt,
            estimatedDelivery: ShopSync_Orders.estimatedDelivery,
            actualDelivery: ShopSync_Orders.actualDelivery,
            d_rating: ShopSync_Orders.d_rating,
            plt_fee: ShopSync_Orders.plt_fee,
            del_fee: ShopSync_Orders.del_fee,
            tax: ShopSync_Orders.tax,
            discount_amount: ShopSync_Orders.discount_amount,

            shopId: ShopSync_Shops.id,
            shopName: ShopSync_Shops.name,

            productId: ShopSync_Products.id,
            productName: ShopSync_Products.name,

            productPrice: ShopSync_OrderItems.price,
            quantity: ShopSync_OrderItems.quantity,
            itemRating: ShopSync_OrderItems.rating,
        })
        .from(ShopSync_Orders)
        .orderBy(desc(ShopSync_Orders.createdAt))
        .where(eq(ShopSync_Orders.customerId, id))
        .leftJoin(ShopSync_OrderItems, eq(ShopSync_OrderItems.orderId, ShopSync_Orders.id))
        .leftJoin(ShopSync_Products, eq(ShopSync_Products.id, ShopSync_OrderItems.productId))
        .leftJoin(ShopSync_Shops, eq(ShopSync_Shops.id, ShopSync_Orders.shopId));

    const groupedOrders = new Map<number, groupedOrder>();

    for (const row of rows) {
        const { orderId } = row;

        if (!groupedOrders.has(orderId)) {
            groupedOrders.set(orderId, {
                id: orderId,
                status: row.status,
                createdAt: row.createdAt,
                estimatedDelivery: row.estimatedDelivery,
                actualDelivery: row.actualDelivery,
                d_rating: row.d_rating,
                plt_fee: row.plt_fee,
                del_fee: row.del_fee,
                tax: row.tax,
                discount_amount: row.discount_amount,
                shop: {
                    id: row.shopId,
                    name: row.shopName,
                },
                items: [],
            });
        }

        // Only push an item if productId exists (meaning there was a matching order item and product)
        if (row.productId) {
            const priceAsNumber = row.productPrice ? parseFloat(row.productPrice) : null;
            groupedOrders.get(orderId)?.items.push({
                id: row.productId,
                name: row.productName,
                price: priceAsNumber,
                quantity: row.quantity,
                rating: row.itemRating,
            });
        }
    }

    return NextResponse.json(Array.from(groupedOrders.values()));
}