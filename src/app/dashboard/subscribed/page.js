// src/app/dashboard/subscribed/page.js
// Redirect handled by ?subscribed=1 query in dashboard
// This file is a bonus confirmation page
import Link from 'next/link';

export default function SubscribedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center text-center px-6">
      <div>
        <div className="text-6xl mb-6">🎉</div>
        <h1 className="text-4xl font-black mb-4">You&apos;re in!</h1>
        <p className="text-gray-400 text-xl mb-8">Your subscription is active. Start entering scores to join the monthly draw.</p>
        <Link href="/dashboard" className="btn-primary text-lg px-8 py-3 inline-block">Go to Dashboard</Link>
      </div>
    </div>
  );
}
