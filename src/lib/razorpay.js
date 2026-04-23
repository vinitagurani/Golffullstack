// src/lib/razorpay.js
import crypto from "crypto";

export { POOL_CONTRIBUTION, calculatePrizePools } from "@/lib/utils";

// Lazy init — only runs on server when actually called
export function getRazorpay() {
  const Razorpay = require("razorpay");
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

export function verifyWebhookSignature(body, signature, secret) {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");
  return expected === signature;
}

export function verifyPaymentSignature({
  subscriptionId,
  paymentId,
  signature,
}) {
  const payload = `${paymentId}|${subscriptionId}`;
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(payload)
    .digest("hex");
  return expected === signature;
}
