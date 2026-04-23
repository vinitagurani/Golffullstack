'use client';
// src/components/ScoreManager.js
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ScoreManager({ userId, initialScores }) {
  const router = useRouter();
  const [scores, setScores] = useState(initialScores);
  const [newScore, setNewScore] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function addScore() {
    setError('');
    if (!newScore || newScore < 1 || newScore > 45) { setError('Score must be 1–45'); return; }
    setLoading(true);
    const res = await fetch('/api/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score: Number(newScore), score_date: newDate }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || 'Failed to save score'); setLoading(false); return; }
    setNewScore('');
    router.refresh();
    setLoading(false);
  }

  async function deleteScore(id) {
    await fetch(`/api/scores?id=${id}`, { method: 'DELETE' });
    router.refresh();
  }

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-4">Your Scores</h2>
      <p className="text-gray-400 text-sm mb-5">Enter your latest Stableford scores (1–45). Only the last 5 are retained.</p>

      {/* Add score */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1">
          <label className="label">Score</label>
          <input
            type="number" min={1} max={45} className="input"
            value={newScore} onChange={(e) => setNewScore(e.target.value)}
            placeholder="e.g. 32"
          />
        </div>
        <div className="flex-1">
          <label className="label">Date</label>
          <input type="date" className="input" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
        </div>
        <div className="flex items-end">
          <button onClick={addScore} disabled={loading} className="btn-primary whitespace-nowrap">
            {loading ? '…' : '+ Add'}
          </button>
        </div>
      </div>
      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {/* Score list */}
      {scores.length === 0 ? (
        <p className="text-gray-500 text-sm">No scores entered yet.</p>
      ) : (
        <div className="space-y-2">
          {scores.map((s, i) => (
            <div key={s.id} className="flex items-center justify-between bg-gray-800 rounded-xl px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-brand-500/20 text-brand-500 font-bold text-sm flex items-center justify-center">
                  {s.score}
                </span>
                <span className="text-gray-300 text-sm">{new Date(s.score_date).toLocaleDateString('en-GB')}</span>
              </div>
              {i === 0 && <span className="text-xs text-brand-500 font-semibold">LATEST</span>}
              <button onClick={() => deleteScore(s.id)} className="text-gray-600 hover:text-red-400 text-sm transition-colors">✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
