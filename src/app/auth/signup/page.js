"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    plan: "monthly",
  });
  const [charities, setCharities] = useState([]);
  const [charityId, setCharityId] = useState("");
  const [charityPct, setCharityPct] = useState(10);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase
      .from("charities")
      .select("id,name")
      .eq("active", true)
      .then(({ data }) => {
        setCharities(data || []);
        if (data?.length) setCharityId(data[0].id);
      });
  }, []);

  async function loadRazorpay() {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    // 1. Create auth user
    const { data: authData, error: signupError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.full_name } },
    });
    if (signupError) {
      setError(signupError.message);
      setLoading(false);
      return;
    }

    const userId = authData.user.id;

    // 2. Update profile with charity
    await supabase
      .from("profiles")
      .update({
        charity_id: charityId || null,
        charity_percentage: charityPct,
      })
      .eq("id", userId);

    // 3. Create Razorpay subscription
    const res = await fetch("/api/subscriptions/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: form.plan, userId, email: form.email }),
    });

    if (!res.ok) {
      // Account created, skip payment
      router.push("/dashboard");
      return;
    }

    const { subscriptionId, keyId } = await res.json();

    // 4. Load Razorpay and open checkout
    const loaded = await loadRazorpay();
    if (!loaded) {
      setError("Failed to load payment gateway");
      setLoading(false);
      return;
    }

    const options = {
      key: keyId,
      subscription_id: subscriptionId,
      name: "GolfGive",
      description: `${form.plan === "yearly" ? "Yearly" : "Monthly"} Membership`,
      prefill: { email: form.email, name: form.full_name },
      theme: { color: "#22c55e" },
      handler: async (response) => {
        // 5. Verify payment on server
        await fetch("/api/subscriptions/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_subscription_id: response.razorpay_subscription_id,
            razorpay_signature: response.razorpay_signature,
            plan: form.plan,
            userId,
          }),
        });
        router.push("/dashboard?subscribed=1");
      },
      modal: {
        ondismiss: () => {
          // Payment cancelled, still go to dashboard (account exists)
          router.push("/dashboard");
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <Link
          href="/"
          className="text-2xl font-black text-brand-500 block text-center mb-8"
        >
          GolfGive
        </Link>
        <div className="card">
          <h1 className="text-2xl font-bold mb-6">Create your account</h1>
          {error && (
            <p className="bg-red-900/40 border border-red-700 text-red-300 rounded-lg px-4 py-3 mb-4 text-sm">
              {error}
            </p>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Full Name</label>
              <input
                className="input"
                value={form.full_name}
                onChange={(e) =>
                  setForm({ ...form, full_name: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                minLength={8}
                required
              />
            </div>

            <div>
              <label className="label">Subscription Plan</label>
              <div className="grid grid-cols-2 gap-3">
                {["monthly", "yearly"].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setForm({ ...form, plan: p })}
                    className={`py-3 rounded-xl border-2 font-semibold capitalize transition-all ${
                      form.plan === p
                        ? "border-brand-500 bg-brand-500/10 text-brand-500"
                        : "border-gray-700 text-gray-400"
                    }`}
                  >
                    {p}{" "}
                    {p === "yearly" && (
                      <span className="text-xs">(save 20%)</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Choose Your Charity</label>
              <select
                className="input"
                value={charityId}
                onChange={(e) => setCharityId(e.target.value)}
              >
                {charities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">
                Charity Contribution: {charityPct}% of subscription
              </label>
              <input
                type="range"
                min={10}
                max={50}
                value={charityPct}
                onChange={(e) => setCharityPct(Number(e.target.value))}
                className="w-full accent-brand-500"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>10% (min)</span>
                <span>50%</span>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary w-full text-base"
              disabled={loading}
            >
              {loading ? "Creating account…" : "Create Account & Subscribe"}
            </button>
          </form>
          <p className="text-center text-gray-400 mt-4 text-sm">
            Already a member?{" "}
            <Link href="/auth/login" className="text-brand-500 hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
