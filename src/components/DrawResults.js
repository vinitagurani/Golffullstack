// src/components/DrawResults.js
// src/components/DrawResults.js
export default function DrawResults({ draw, userScores }) {
  if (!draw) {
    return (
      <div className="card">
        <h2 className="text-xl font-bold mb-2">Latest Draw</h2>
        <p className="text-gray-500 text-sm">No published draw yet. Check back soon.</p>
      </div>
    );
  }

  const drawSet = new Set(draw.draw_numbers);
  const matched = userScores.filter((s) => drawSet.has(s));
  const matchCount = matched.length;
  const tier = matchCount >= 5 ? '🏆 Jackpot Winner!' : matchCount === 4 ? '🥈 4-Number Match!' : matchCount === 3 ? '🥉 3-Number Match!' : null;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Latest Draw</h2>
        <span className="text-gray-400 text-sm">{draw.month}/{draw.year}</span>
      </div>

      <div className="flex gap-2 mb-4">
        {draw.draw_numbers.map((n) => (
          <div
            key={n}
            className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-black transition-all ${
              userScores.includes(n) ? 'bg-brand-500 text-white' : 'bg-gray-800 text-gray-400'
            }`}
          >
            {n}
          </div>
        ))}
      </div>

      {tier ? (
        <div className="bg-brand-500/10 border border-brand-500/30 rounded-xl px-4 py-3">
          <p className="text-brand-500 font-bold">{tier}</p>
          <p className="text-gray-400 text-sm mt-1">Your matched numbers: {matched.join(', ')}</p>
        </div>
      ) : (
        <p className="text-gray-500 text-sm">
          {userScores.length === 0
            ? 'Enter your scores to participate in draws.'
            : `You matched ${matchCount} number${matchCount !== 1 ? 's' : ''}. Need 3+ to win.`}
        </p>
      )}
    </div>
  );
}
