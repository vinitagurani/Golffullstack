'use client';
// src/components/admin/AdminWinners.js
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminWinners({ winners }) {
  const router = useRouter();
  const [loading, setLoading] = useState('');

  async function updateStatus(id, status) {
    setLoading(id + status);
    await fetch('/api/admin/winners', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    setLoading('');
    router.refresh();
  }

  const STATUS_COLOR = {
    pending:  'text-yellow-400',
    verified: 'text-blue-400',
    paid:     'text-green-400',
    rejected: 'text-red-400',
  };

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-4">Winners & Payouts</h2>
      {winners.length === 0 ? (
        <p className="text-gray-500 text-sm">No winners yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 border-b border-gray-800">
                <th className="text-left py-2">User</th>
                <th className="text-left py-2">Draw</th>
                <th className="text-left py-2">Match</th>
                <th className="text-left py-2">Prize</th>
                <th className="text-left py-2">Proof</th>
                <th className="text-left py-2">Status</th>
                <th className="text-left py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {winners.map((w) => (
                <tr key={w.id} className="border-b border-gray-800/50">
                  <td className="py-2">{w.profiles?.full_name || w.profiles?.email}</td>
                  <td className="py-2">{w.draws?.month}/{w.draws?.year}</td>
                  <td className="py-2">{w.match_type}-Match</td>
                  <td className="py-2 text-brand-500 font-semibold">£{Number(w.prize_amount).toFixed(2)}</td>
                  <td className="py-2">
                    {w.proof_url
                      ? <a href={w.proof_url} target="_blank" rel="noreferrer" className="text-brand-500 underline text-xs">View</a>
                      : <span className="text-gray-600 text-xs">None</span>}
                  </td>
                  <td className="py-2">
                    <span className={`capitalize text-xs font-semibold ${STATUS_COLOR[w.status]}`}>{w.status}</span>
                  </td>
                  <td className="py-2">
                    <div className="flex gap-2">
                      {w.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateStatus(w.id, 'verified')}
                            disabled={loading === w.id + 'verified'}
                            className="text-xs bg-blue-900/40 text-blue-400 px-2 py-1 rounded hover:bg-blue-900/70 transition-colors"
                          >Verify</button>
                          <button
                            onClick={() => updateStatus(w.id, 'rejected')}
                            disabled={loading === w.id + 'rejected'}
                            className="text-xs bg-red-900/40 text-red-400 px-2 py-1 rounded hover:bg-red-900/70 transition-colors"
                          >Reject</button>
                        </>
                      )}
                      {w.status === 'verified' && (
                        <button
                          onClick={() => updateStatus(w.id, 'paid')}
                          disabled={loading === w.id + 'paid'}
                          className="text-xs bg-green-900/40 text-green-400 px-2 py-1 rounded hover:bg-green-900/70 transition-colors"
                        >Mark Paid</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
