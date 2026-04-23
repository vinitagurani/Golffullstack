'use client';
// src/app/auth/login/page.js
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword(form);
    if (error) { setError(error.message); setLoading(false); return; }

    // Check role for redirect
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .single();
    router.push(profile?.role === 'admin' ? '/admin' : '/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="text-2xl font-black text-brand-500 block text-center mb-8">GolfGive</Link>
        <div className="card">
          <h1 className="text-2xl font-bold mb-6">Welcome back</h1>
          {error && <p className="bg-red-900/40 border border-red-700 text-red-300 rounded-lg px-4 py-3 mb-4 text-sm">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
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
                required
              />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
          <p className="text-center text-gray-400 mt-4 text-sm">
            No account? <Link href="/auth/signup" className="text-brand-500 hover:underline">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
