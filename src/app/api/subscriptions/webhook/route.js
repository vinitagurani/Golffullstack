// src/app/api/subscriptions/webhook/route.js
import { verifyWebhookSignature } from "@/lib/razorpay";
import { createAdminClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(req) {
  const body = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  const isValid = verifyWebhookSignature(
    body,
    signature,
    process.env.RAZORPAY_WEBHOOK_SECRET,
  );
  if (!isValid)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });

  const event = JSON.parse(body);
  const admin = createAdminClient();
  const payload = event.payload?.subscription?.entity;

  async function getUserId(subId) {
    const { data } = await admin
      .from("profiles")
      .select("id")
      .eq("subscription_id", subId)
      .single();
    return data?.id;
  }

  switch (event.event) {
    case "subscription.activated": {
      const userId = payload?.notes?.userId;
      if (userId) {
        const periodEnd = new Date();
        periodEnd.setMonth(
          periodEnd.getMonth() + (payload?.notes?.plan === "yearly" ? 12 : 1),
        );
        await admin
          .from("profiles")
          .update({
            subscription_status: "active",
            subscription_id: payload.id,
            plan: payload?.notes?.plan,
            period_end: periodEnd.toISOString(),
          })
          .eq("id", userId);
      }
      break;
    }

    case "subscription.cancelled": {
      const userId = await getUserId(payload?.id);
      if (userId)
        await admin
          .from("profiles")
          .update({ subscription_status: "cancelled" })
          .eq("id", userId);
      break;
    }

    case "subscription.halted": {
      const userId = await getUserId(payload?.id);
      if (userId)
        await admin
          .from("profiles")
          .update({ subscription_status: "past_due" })
          .eq("id", userId);
      break;
    }

    case "subscription.resumed": {
      const userId = await getUserId(payload?.id);
      if (userId)
        await admin
          .from("profiles")
          .update({ subscription_status: "active" })
          .eq("id", userId);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
