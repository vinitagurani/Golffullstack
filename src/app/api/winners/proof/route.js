// src/app/api/winners/proof/route.js
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { NextResponse } from 'next/server';

export async function POST(req) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const form     = await req.formData();
  const file     = form.get('file');
  const winnerId = form.get('winnerId');

  if (!file || !winnerId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  const bytes    = await file.arrayBuffer();
  const buffer   = Buffer.from(bytes);
  const ext      = file.name.split('.').pop();
  const path     = `proofs/${user.id}/${winnerId}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('winner-proofs')
    .upload(path, buffer, { contentType: file.type, upsert: true });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: { publicUrl } } = supabase.storage.from('winner-proofs').getPublicUrl(path);

  // Verify the winner belongs to this user
  const { error: updateError } = await supabase
    .from('winners')
    .update({ proof_url: publicUrl })
    .eq('id', winnerId)
    .eq('user_id', user.id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({ url: publicUrl });
}
