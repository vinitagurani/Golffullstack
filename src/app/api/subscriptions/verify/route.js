// src/app/api/subscriptions/verify/route.js
import { verifyPaymentSignature } from "@/lib/razorpay";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(req) {
  const {
    razorpay_payment_id,
    razorpay_subscription_id,
    razorpay_signature,
    plan,
    userId,
  } = await req.json();

  const isValid = verifyPaymentSignature({
    subscriptionId: razorpay_subscription_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
  });

  if (!isValid)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });

  const admin = createAdminClient();

  // Calculate period end based on plan
  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + (plan === "yearly" ? 12 : 1));

  await admin
    .from("profiles")
    .update({
      subscription_status: "active",
      subscription_id: razorpay_subscription_id,
      plan,
      period_end: periodEnd.toISOString(),
    })
    .eq("id", userId);

  return NextResponse.json({ success: true });
}
