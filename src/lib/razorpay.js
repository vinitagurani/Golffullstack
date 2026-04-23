"server only";
import Razorpay from "razorpay";
import crypto from "crypto";

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const PLANS = {
  monthly: process.env.RAZORPAY_MONTHLY_PLAN_ID,
  yearly: process.env.RAZORPAY_YEARLY_PLAN_ID,
};

export const POOL_CONTRIBUTION = 5;

export function calculatePrizePools(totalPool) {
  return {
    jackpot: +(totalPool * 0.4).toFixed(2),
    fourMatch: +(totalPool * 0.35).toFixed(2),
    threeMatch: +(totalPool * 0.25).toFixed(2),
  };
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
