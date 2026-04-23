'use client';
// src/components/WinnersCard.js
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

const STATUS_COLOR = {
  pending:  'text-yellow-400',
  verified: 'text-blue-400',
  paid:     'text-green-400',
  rejected: 'text-red-400',
};

export default function WinnersCard({ winners }) {
  const [uploading, setUploading] = useState(null);
  const router = useRouter();

  async function uploadProof(winnerId, file) {
    setUploading(winnerId);
    const form = new FormData();
    form.append('file', file);
    form.append('winnerId', winnerId);
    await fetch('/api/winners/proof', { method: 'POST', body: form });
    setUploading(null);
    router.refresh();
  }

  return (
    <div className="card">
      <h3 className="font-bold mb-3">My Winnings</h3>
      {winners.length === 0 ? (
        <p className="text-gray-500 text-sm">No winnings yet. Keep playing!</p>
      ) : (
        <div className="space-y-3">
          {winners.map((w) => (
            <div key={w.id} className="bg-gray-800 rounded-xl p-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-sm">{w.match_type}-Number Match</p>
                  <p className="text-gray-400 text-xs">{w.draws?.month}/{w.draws?.year}</p>
                </div>
                <div className="text-right">
                  <p className="text-brand-500 font-bold">£{Number(w.prize_amount).toFixed(2)}</p>
                  <p className={`text-xs capitalize font-medium ${STATUS_COLOR[w.status]}`}>{w.status}</p>
                </div>
              </div>
              {w.status === 'pending' && !w.proof_url && (
                <label className="mt-2 block cursor-pointer">
                  <span className="text-xs text-brand-500 underline">
                    {uploading === w.id ? 'Uploading…' : 'Upload score proof'}
                  </span>
                  <input
                    type="file" accept="image/*,.pdf" className="hidden"
                    onChange={(e) => e.target.files?.[0] && uploadProof(w.id, e.target.files[0])}
                  />
                </label>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
