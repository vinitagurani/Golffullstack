'use client';
// src/components/admin/AdminDraw.js
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { calculatePrizePools } from "@/lib/utils";

export default function AdminDraw({ draws, subscriberCount }) {
  const router = useRouter();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year,  setYear]  = useState(now.getFullYear());
  const [logic, setLogic] = useState('random');
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState('');

  const totalPool = subscriberCount * 5;
  const pools = calculatePrizePools(totalPool);

  async function runSimulation() {
    setLoading('sim');
    const res = await fetch('/api/admin/draws/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ month, year, logic, simulate: true }),
    });
    const data = await res.json();
    setPreview(data);
    setLoading('');
  }

  async function publishDraw() {
    setLoading('pub');
    await fetch('/api/admin/draws/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ month, year, logic, simulate: false }),
    });
    setPreview(null);
    setLoading('');
    router.refresh();
  }

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-4">Draw Management</h2>

      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="label">Month</label>
          <select className="input" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Year</label>
          <input type="number" className="input" value={year} onChange={(e) => setYear(Number(e.target.value))} />
        </div>
        <div>
          <label className="label">Logic</label>
          <select className="input" value={logic} onChange={(e) => setLogic(e.target.value)}>
            <option value="random">Random</option>
            <option value="algorithmic">Algorithmic</option>
          </select>
        </div>
        <div className="flex flex-col justify-end gap-2">
          <button onClick={runSimulation} disabled={loading === 'sim'} className="btn-secondary text-sm py-2">
            {loading === 'sim' ? '…' : 'Simulate'}
          </button>
        </div>
      </div>

      {/* Prize pool preview */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Jackpot (40%)',   value: pools.jackpot },
          { label: '4-Match (35%)',   value: pools.fourMatch },
          { label: '3-Match (25%)',   value: pools.threeMatch },
        ].map((p) => (
          <div key={p.label} className="bg-gray-800 rounded-xl p-3 text-center">
            <p className="text-brand-500 font-bold">£{p.value}</p>
            <p className="text-gray-400 text-xs mt-1">{p.label}</p>
          </div>
        ))}
      </div>

      {/* Simulation preview */}
      {preview && (
        <div className="bg-gray-800 rounded-xl p-4 mb-4">
          <p className="font-semibold mb-2">Simulation Preview</p>
          <div className="flex gap-2 mb-3">
            {preview.numbers?.map((n) => (
              <div key={n} className="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center font-bold text-sm">{n}</div>
            ))}
          </div>
          <p className="text-gray-400 text-sm mb-3">
            Winners: {preview.winnerCount ?? 0} | Jackpot winner: {preview.hasJackpot ? 'Yes' : 'No (will rollover)'}
          </p>
          <button onClick={publishDraw} disabled={loading === 'pub'} className="btn-primary text-sm py-2 px-6">
            {loading === 'pub' ? 'Publishing…' : 'Publish Draw'}
          </button>
        </div>
      )}

      {/* Past draws */}
      <h3 className="font-semibold mb-3 mt-2">Past Draws</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 border-b border-gray-800">
              <th className="text-left py-2">Month/Year</th>
              <th className="text-left py-2">Numbers</th>
              <th className="text-left py-2">Logic</th>
              <th className="text-left py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {draws.map((d) => (
              <tr key={d.id} className="border-b border-gray-800/50">
                <td className="py-2">{d.month}/{d.year}</td>
                <td className="py-2">{d.draw_numbers?.join(', ')}</td>
                <td className="py-2 capitalize">{d.logic}</td>
                <td className="py-2">
                  <span className={`capitalize text-xs font-semibold ${d.status === 'published' ? 'text-green-400' : 'text-yellow-400'}`}>
                    {d.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
