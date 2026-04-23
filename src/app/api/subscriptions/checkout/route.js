import { getRazorpay, PLANS } from "@/lib/razorpay";
import { NextResponse } from "next/server";

export async function POST(req) {
  const { plan, userId, email } = await req.json();

  const planId = PLANS[plan];
  if (!planId)
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

  try {
    const razorpay = getRazorpay();
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      customer_notify: 1,
      total_count: plan === "yearly" ? 12 : 120,
      notes: { userId, plan, email },
    });

    return NextResponse.json({
      subscriptionId: subscription.id,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("Razorpay error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
