import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subscription, userId } = body;

    // Here you would typically save the subscription to your database
    // For now, we'll just log it
    console.log('Push subscription received:', subscription);
    console.log('For user:', userId);

    // In a real app, you'd save this to your database:
    // await db.insert(PushSubscriptions).values({
    //   userId,
    //   endpoint: subscription.endpoint,
    //   p256dh: subscription.keys.p256dh,
    //   auth: subscription.keys.auth,
    //   createdAt: new Date()
    // });

    return NextResponse.json({ 
      message: "Subscription saved successfully" 
    }, { status: 200 });

  } catch (error) {
    console.error("Error saving push subscription:", error);
    return NextResponse.json({ 
      error: "Failed to save subscription" 
    }, { status: 500 });
  }
}