import { getRazorpay } from "@/lib/razorpay";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_id")
    .eq("id", user.id)
    .single();

  if (!profile?.subscription_id)
    return NextResponse.json({ error: "No subscription" }, { status: 400 });

  try {
    const razorpay = getRazorpay();
    await razorpay.subscriptions.cancel(profile.subscription_id, {
      cancel_at_cycle_end: 1,
    });
    const admin = createAdminClient();
    await admin
      .from("profiles")
      .update({ subscription_status: "cancelled" })
      .eq("id", user.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
