// src/app/dashboard/page.js
export const dynamic = "force-dynamic";
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from "@/lib/supabase-server";
import ScoreManager from '@/components/ScoreManager';
import SubscriptionCard from '@/components/SubscriptionCard';
import WinnersCard from '@/components/WinnersCard';
import DrawResults from '@/components/DrawResults';

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, charities(name)')
    .eq('id', user.id)
    .single();

  if (profile?.role === 'admin') redirect('/admin');

  const { data: scores } = await supabase
    .from('scores')
    .select('*')
    .eq('user_id', user.id)
    .order('score_date', { ascending: false })
    .limit(5);

  const { data: winners } = await supabase
    .from('winners')
    .select('*, draws(month, year)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const { data: latestDraw } = await supabase
    .from('draws')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-gray-800 px-8 py-5 flex items-center justify-between">
        <span className="text-xl font-black text-brand-500">GolfGive</span>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm">{profile?.full_name || user.email}</span>
          <form action="/api/auth/signout" method="POST">
            <button className="text-sm text-gray-500 hover:text-white transition-colors">Sign out</button>
          </form>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-10 grid gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          <ScoreManager userId={user.id} initialScores={scores || []} />
          <DrawResults draw={latestDraw} userScores={(scores || []).map((s) => s.score)} />
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <SubscriptionCard profile={profile} />
          {/* Charity card */}
          <div className="card">
            <h3 className="font-bold mb-3">Your Charity</h3>
            <p className="text-brand-500 font-semibold">{profile?.charities?.name || '—'}</p>
            <p className="text-gray-400 text-sm mt-1">Contributing {profile?.charity_percentage}% of your subscription</p>
          </div>
          <WinnersCard winners={winners || []} />
        </div>
      </div>
    </div>
  );
}
