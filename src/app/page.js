// src/app/page.js
import Link from 'next/link';
import { createServerSupabaseClient } from "@/lib/supabase-server";

export default async function HomePage() {
  const supabase = createServerSupabaseClient();
  const { data: charities } = await supabase
    .from('charities')
    .select('*')
    .eq('featured', true)
    .eq('active', true)
    .limit(3);

  const { data: latestDraw } = await supabase
    .from('draws')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return (
    <main>
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-800">
        <span className="text-2xl font-black tracking-tight text-brand-500">GolfGive</span>
        <div className="flex gap-4">
          <Link href="/auth/login" className="btn-secondary text-sm py-2 px-4">Log in</Link>
          <Link href="/auth/signup" className="btn-primary text-sm py-2 px-4">Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="text-center py-24 px-6 max-w-4xl mx-auto">
        <p className="text-brand-500 font-semibold text-sm uppercase tracking-widest mb-4">Play · Win · Give</p>
        <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6">
          Golf that <span className="text-brand-500">changes lives</span>
        </h1>
        <p className="text-gray-400 text-xl mb-10 max-w-2xl mx-auto">
          Track your Stableford scores, enter monthly prize draws, and automatically support the charity that matters to you.
        </p>
        <Link href="/auth/signup" className="btn-primary text-lg px-10 py-4 inline-block">
          Start Your Membership
        </Link>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">How it works</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { n: '01', title: 'Subscribe', desc: 'Choose a monthly or yearly plan. A portion automatically goes to your chosen charity.' },
            { n: '02', title: 'Enter Scores', desc: 'Log your last 5 Stableford scores. Your latest scores form your draw entry.' },
            { n: '03', title: 'Win & Give', desc: 'Monthly draws reward top scorers. Jackpots roll over until someone wins.' },
          ].map((s) => (
            <div key={s.n} className="card text-center">
              <div className="text-4xl font-black text-brand-500 mb-3">{s.n}</div>
              <h3 className="text-xl font-bold mb-2">{s.title}</h3>
              <p className="text-gray-400">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Prize pools */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-4">Prize Tiers</h2>
        <p className="text-gray-400 text-center mb-10">Every subscriber contributes to the monthly prize pool.</p>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { match: '5-Number Match', share: '40%', rollover: true,  label: 'JACKPOT' },
            { match: '4-Number Match', share: '35%', rollover: false, label: '' },
            { match: '3-Number Match', share: '25%', rollover: false, label: '' },
          ].map((t) => (
            <div key={t.match} className={`card text-center ${t.rollover ? 'border-brand-500' : ''}`}>
              {t.rollover && <span className="text-xs bg-brand-500 text-white px-2 py-1 rounded-full font-bold">JACKPOT ROLLOVER</span>}
              <div className="text-3xl font-black text-brand-500 mt-3">{t.share}</div>
              <div className="text-gray-300 mt-1">{t.match}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured charities */}
      {charities && charities.length > 0 && (
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-center mb-10">Charities we support</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {charities.map((c) => (
              <div key={c.id} className="card">
                <h3 className="text-lg font-bold mb-2">{c.name}</h3>
                <p className="text-gray-400 text-sm">{c.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Latest draw */}
      {latestDraw && (
        <section className="max-w-2xl mx-auto px-6 py-16 text-center">
          <h2 className="text-3xl font-bold mb-4">Latest Draw Numbers</h2>
          <p className="text-gray-400 mb-6">{latestDraw.month}/{latestDraw.year}</p>
          <div className="flex justify-center gap-3">
            {latestDraw.draw_numbers.map((n) => (
              <div key={n} className="w-14 h-14 rounded-full bg-brand-500 flex items-center justify-center text-xl font-black">
                {n}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="text-center py-24 px-6">
        <h2 className="text-4xl font-black mb-4">Ready to play your part?</h2>
        <p className="text-gray-400 mb-8">Join thousands of golfers making a difference with every round.</p>
        <Link href="/auth/signup" className="btn-primary text-lg px-10 py-4 inline-block">
          Join GolfGive Today
        </Link>
      </section>

      <footer className="border-t border-gray-800 py-8 text-center text-gray-600 text-sm">
        © {new Date().getFullYear()} GolfGive. All rights reserved.
      </footer>
    </main>
  );
}
