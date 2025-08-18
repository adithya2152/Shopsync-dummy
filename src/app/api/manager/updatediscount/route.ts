import { updateDiscount  , removeDiscount} from "@/db";
import { NextResponse } from "next/server";

export async function PUT(req: Request) {
  try {
    const url = new URL(req.url);
    const shopIdParam = url.searchParams.get("shopId");

    if (!shopIdParam) {
      return NextResponse.json({ error: "Missing shopId" }, { status: 400 });
    }
    const shopId = parseInt(shopIdParam);
    if (isNaN(shopId)) {
      return NextResponse.json({ error: "Invalid shopId" }, { status: 400 });
    }

    const body = await req.json();
    const { productId, discount } = body;

    console.log("Updating discount for productId:", productId , "shopId:", shopId , "discount:", discount);

    if (!shopId || !productId) {
      return NextResponse.json(
        { error: "Missing shopId or productId" },
        { status: 400 }
      );
    }
    if(discount === null)
    {
      const res = await removeDiscount(shopId, productId);
      if(res?.error)
      {
        return NextResponse.json(
          { error: res.error },
          { status: 500 }
        );
      }
      return NextResponse.json({status:200});
    }
    const res = await updateDiscount(shopId, productId, discount);

    if(res?.error)
    {
      return NextResponse.json(
        { error: res.error },
        { status: 500 }
      );
    }
    return NextResponse.json({status:200});
  } catch (error) {
    console.error("❌ API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
