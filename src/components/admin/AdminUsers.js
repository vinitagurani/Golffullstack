'use client';
// src/components/admin/AdminUsers.js
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminUsers({ users }) {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const filtered = users.filter((u) =>
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  async function toggleRole(id, currentRole) {
    const newRole = currentRole === 'admin' ? 'subscriber' : 'admin';
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, role: newRole }),
    });
    router.refresh();
  }

  const STATUS_COLOR = {
    active:    'text-green-400',
    inactive:  'text-gray-500',
    cancelled: 'text-red-400',
    past_due:  'text-yellow-400',
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Users ({users.length})</h2>
        <input
          className="input w-48 text-sm py-2"
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 border-b border-gray-800">
              <th className="text-left py-2">Name / Email</th>
              <th className="text-left py-2">Plan</th>
              <th className="text-left py-2">Sub Status</th>
              <th className="text-left py-2">Role</th>
              <th className="text-left py-2">Joined</th>
              <th className="text-left py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                <td className="py-2">
                  <p className="font-medium">{u.full_name || '—'}</p>
                  <p className="text-gray-500 text-xs">{u.email}</p>
                </td>
                <td className="py-2 capitalize">{u.plan || '—'}</td>
                <td className="py-2">
                  <span className={`capitalize text-xs font-semibold ${STATUS_COLOR[u.subscription_status]}`}>
                    {u.subscription_status}
                  </span>
                </td>
                <td className="py-2 capitalize">{u.role}</td>
                <td className="py-2 text-gray-500">{new Date(u.created_at).toLocaleDateString('en-GB')}</td>
                <td className="py-2">
                  <button
                    onClick={() => toggleRole(u.id, u.role)}
                    className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded transition-colors"
                  >
                    {u.role === 'admin' ? 'Make Subscriber' : 'Make Admin'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
