// src/app/api/scores/route.js
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { NextResponse } from 'next/server';

export async function POST(req) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  // Must be active subscriber
  const { data: profile } = await supabase.from('profiles').select('subscription_status').eq('id', user.id).single();
  if (profile?.subscription_status !== 'active') {
    return NextResponse.json({ error: 'Active subscription required' }, { status: 403 });
  }

  const { score, score_date } = await req.json();
  if (!score || score < 1 || score > 45) return NextResponse.json({ error: 'Score must be 1–45' }, { status: 400 });
  if (!score_date) return NextResponse.json({ error: 'Date required' }, { status: 400 });

  const { data, error } = await supabase.from('scores').insert({
    user_id: user.id,
    score,
    score_date,
  }).select().single();

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Score already exists for this date' }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(req) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  const { error } = await supabase.from('scores').delete().eq('id', id).eq('user_id', user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
