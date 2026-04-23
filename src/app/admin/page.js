// src/app/admin/page.js
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from "@/lib/supabase-server";
import AdminUsers from '@/components/admin/AdminUsers';
import AdminDraw from '@/components/admin/AdminDraw';
import AdminCharities from '@/components/admin/AdminCharities';
import AdminWinners from '@/components/admin/AdminWinners';

export default async function AdminPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') redirect('/dashboard');

  const [{ data: users }, { data: draws }, { data: charities }, { data: winners }, { count: subCount }] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at', { ascending: false }),
    supabase.from('draws').select('*').order('created_at', { ascending: false }),
    supabase.from('charities').select('*').order('created_at', { ascending: false }),
    supabase.from('winners').select('*, profiles(email,full_name), draws(month,year)').order('created_at', { ascending: false }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'active'),
  ]);

  const totalPool = (subCount || 0) * 5; // £5 per subscriber

  return (
    <div className="min-h-screen">
      <header className="border-b border-gray-800 px-8 py-5 flex items-center justify-between">
        <span className="text-xl font-black text-brand-500">GolfGive <span className="text-gray-500 font-normal text-base">Admin</span></span>
        <form action="/api/auth/signout" method="POST">
          <button className="text-sm text-gray-500 hover:text-white transition-colors">Sign out</button>
        </form>
      </header>

      {/* Stats bar */}
      <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Users',        value: users?.length ?? 0 },
          { label: 'Active Subscribers', value: subCount ?? 0 },
          { label: 'Monthly Prize Pool', value: `£${totalPool.toFixed(2)}` },
          { label: 'Total Draws',        value: draws?.length ?? 0 },
        ].map((s) => (
          <div key={s.label} className="card text-center">
            <div className="text-3xl font-black text-brand-500">{s.value}</div>
            <div className="text-gray-400 text-sm mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-10 space-y-8">
        <AdminDraw draws={draws || []} subscriberCount={subCount || 0} />
        <AdminWinners winners={winners || []} />
        <AdminUsers users={users || []} />
        <AdminCharities charities={charities || []} />
      </div>
    </div>
  );
}
