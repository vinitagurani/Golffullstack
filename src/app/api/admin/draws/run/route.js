// src/app/api/admin/draws/run/route.js
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase';
import { generateDrawNumbers, matchScores } from '@/lib/draw';
import { calculatePrizePools, POOL_CONTRIBUTION } from "@/lib/razorpay";
import { NextResponse } from 'next/server';

export async function POST(req) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { month, year, logic, simulate } = await req.json();
  const admin = createAdminClient();

  // Gather all active subscribers and their scores
  const { data: activeProfiles } = await admin
    .from('profiles')
    .select('id')
    .eq('subscription_status', 'active');

  const userIds = activeProfiles?.map((p) => p.id) || [];

  // Fetch all scores for active users (last 5 each)
  const allScoreValues = [];
  const userScoreMap = {};

  for (const uid of userIds) {
    const { data: scores } = await admin
      .from('scores')
      .select('score')
      .eq('user_id', uid)
      .order('score_date', { ascending: false })
      .limit(5);

    const vals = (scores || []).map((s) => s.score);
    userScoreMap[uid] = vals;
    allScoreValues.push(...vals);
  }

  // Generate draw numbers
  const drawNumbers = generateDrawNumbers(logic, allScoreValues);

  // Calculate prize pool
  const { count: subCount } = await admin
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('subscription_status', 'active');

  const totalPool = (subCount || 0) * POOL_CONTRIBUTION;
  const pools = calculatePrizePools(totalPool);

  // Determine winners
  const matchedWinners = { 5: [], 4: [], 3: [] };
  for (const uid of userIds) {
    const scores = userScoreMap[uid] || [];
    if (scores.length === 0) continue;
    const matchCount = matchScores(scores, drawNumbers);
    if (matchCount >= 3) matchedWinners[matchCount].push(uid);
  }

  const winnerCount = matchedWinners[5].length + matchedWinners[4].length + matchedWinners[3].length;
  const hasJackpot  = matchedWinners[5].length > 0;

  if (simulate) {
    return NextResponse.json({ numbers: drawNumbers, winnerCount, hasJackpot });
  }

  // Check if draw already exists for this month/year
  const { data: existing } = await admin
    .from('draws')
    .select('id')
    .eq('month', month)
    .eq('year', year)
    .single();

  if (existing) return NextResponse.json({ error: 'Draw already published for this period' }, { status: 409 });

  // Insert draw
  const { data: draw, error: drawError } = await admin.from('draws').insert({
    month, year,
    draw_numbers: drawNumbers,
    logic,
    status: 'published',
    total_pool: totalPool,
    published_at: new Date().toISOString(),
  }).select().single();

  if (drawError) return NextResponse.json({ error: drawError.message }, { status: 500 });

  // Insert winners with split prizes
  const winnerInserts = [];
  const tiers = [
    { key: 5, pool: pools.jackpot,    matchType: 5 },
    { key: 4, pool: pools.fourMatch,  matchType: 4 },
    { key: 3, pool: pools.threeMatch, matchType: 3 },
  ];

  for (const tier of tiers) {
    const uids = matchedWinners[tier.key];
    if (uids.length === 0) continue;
    const prize = +(tier.pool / uids.length).toFixed(2);
    for (const uid of uids) {
      winnerInserts.push({ draw_id: draw.id, user_id: uid, match_type: tier.matchType, prize_amount: prize });
    }
  }

  if (winnerInserts.length > 0) {
    await admin.from('winners').insert(winnerInserts);
  }

  return NextResponse.json({ success: true, numbers: drawNumbers, winnerCount, hasJackpot });
}
