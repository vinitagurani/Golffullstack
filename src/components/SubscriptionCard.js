'use client';
// src/components/SubscriptionCard.js
import { useState } from 'react';

const STATUS_COLORS = {
  active:    'text-green-400 bg-green-900/30',
  inactive:  'text-gray-400 bg-gray-800',
  cancelled: 'text-red-400 bg-red-900/30',
  past_due:  'text-yellow-400 bg-yellow-900/30',
};

export default function SubscriptionCard({ profile }) {
  const [loading, setLoading] = useState(false);
  const status = profile?.subscription_status || 'inactive';

async function manageSubscription() {
  if (!confirm("Are you sure you want to cancel your subscription?")) return;
  setLoading(true);
  await fetch("/api/subscriptions/portal", { method: "POST" });
  window.location.reload();
  setLoading(false);
}

  return (
    <div className="card">
      <h3 className="font-bold mb-3">Subscription</h3>
      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold capitalize mb-3 ${STATUS_COLORS[status]}`}>
        {status}
      </span>
      {profile?.plan && <p className="text-gray-400 text-sm capitalize">{profile.plan} plan</p>}
      {profile?.period_end && (
        <p className="text-gray-400 text-sm mt-1">
          Renews {new Date(profile.period_end).toLocaleDateString('en-GB')}
        </p>
      )}
      {status !== 'active' ? (
        <a href="/auth/signup" className="btn-primary w-full mt-4 block text-center text-sm">
          Subscribe Now
        </a>
      ) : (
        <button onClick={manageSubscription} disabled={loading} className="btn-secondary w-full mt-4 text-sm">
          {loading ? 'Loading…' : 'Manage Subscription'}
        </button>
      )}
    </div>
  );
}
