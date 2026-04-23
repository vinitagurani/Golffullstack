'use client';
// src/components/admin/AdminCharities.js
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminCharities({ charities }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', description: '', website: '', featured: false });
  const [loading, setLoading] = useState(false);

  async function addCharity(e) {
    e.preventDefault();
    setLoading(true);
    await fetch('/api/admin/charities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setForm({ name: '', description: '', website: '', featured: false });
    setLoading(false);
    router.refresh();
  }

  async function toggleActive(id, active) {
    await fetch('/api/admin/charities', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, active: !active }),
    });
    router.refresh();
  }

  async function deleteCharity(id) {
    if (!confirm('Delete this charity?')) return;
    await fetch(`/api/admin/charities?id=${id}`, { method: 'DELETE' });
    router.refresh();
  }

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-4">Charity Management</h2>

      {/* Add form */}
      <form onSubmit={addCharity} className="grid md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-800 rounded-xl">
        <div>
          <label className="label">Charity Name</label>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div>
          <label className="label">Website</label>
          <input className="input" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
        </div>
        <div className="md:col-span-2">
          <label className="label">Description</label>
          <textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="featured" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="accent-brand-500" />
          <label htmlFor="featured" className="text-sm text-gray-400">Feature on homepage</label>
        </div>
        <div className="flex justify-end">
          <button type="submit" disabled={loading} className="btn-primary text-sm py-2 px-6">
            {loading ? 'Adding…' : 'Add Charity'}
          </button>
        </div>
      </form>

      {/* List */}
      <div className="space-y-2">
        {charities.map((c) => (
          <div key={c.id} className="flex items-center justify-between bg-gray-800 rounded-xl px-4 py-3">
            <div>
              <p className="font-medium">{c.name} {c.featured && <span className="text-xs text-brand-500 ml-1">★ Featured</span>}</p>
              <p className="text-gray-500 text-xs">{c.description?.slice(0, 60)}…</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => toggleActive(c.id, c.active)}
                className={`text-xs px-2 py-1 rounded ${c.active ? 'bg-green-900/40 text-green-400' : 'bg-gray-700 text-gray-400'}`}
              >
                {c.active ? 'Active' : 'Inactive'}
              </button>
              <button onClick={() => deleteCharity(c.id)} className="text-xs bg-red-900/40 text-red-400 px-2 py-1 rounded hover:bg-red-900/70">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
