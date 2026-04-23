// src/lib/draw.js

/**
 * Generate 5 unique draw numbers (1–45)
 * mode: 'random' | 'algorithmic'
 * allScores: flat array of score values from all subscribers (for algorithmic mode)
 */
export function generateDrawNumbers(mode = 'random', allScores = []) {
  if (mode === 'algorithmic' && allScores.length > 0) {
    return algorithmicDraw(allScores);
  }
  return randomDraw();
}

function randomDraw() {
  const pool = Array.from({ length: 45 }, (_, i) => i + 1);
  const drawn = [];
  while (drawn.length < 5) {
    const idx = Math.floor(Math.random() * pool.length);
    drawn.push(pool.splice(idx, 1)[0]);
  }
  return drawn.sort((a, b) => a - b);
}

function algorithmicDraw(allScores) {
  // Build frequency map
  const freq = {};
  for (let i = 1; i <= 45; i++) freq[i] = 0;
  allScores.forEach((s) => { if (freq[s] !== undefined) freq[s]++; });

  // Weighted: least frequent numbers get higher weight (more surprising draws)
  const maxFreq = Math.max(...Object.values(freq)) + 1;
  const weighted = [];
  Object.entries(freq).forEach(([num, f]) => {
    const weight = maxFreq - f;
    for (let i = 0; i < weight; i++) weighted.push(Number(num));
  });

  const drawn = [];
  const seen = new Set();
  while (drawn.length < 5 && weighted.length > 0) {
    const idx = Math.floor(Math.random() * weighted.length);
    const num = weighted[idx];
    if (!seen.has(num)) { seen.add(num); drawn.push(num); }
    weighted.splice(idx, 1);
  }
  // Fallback: fill from random if needed
  while (drawn.length < 5) {
    const n = Math.floor(Math.random() * 45) + 1;
    if (!seen.has(n)) { seen.add(n); drawn.push(n); }
  }
  return drawn.sort((a, b) => a - b);
}

/**
 * Match a user's scores against draw numbers.
 * Returns 3, 4, 5, or 0.
 */
export function matchScores(userScores, drawNumbers) {
  const drawSet = new Set(drawNumbers);
  const matched = userScores.filter((s) => drawSet.has(s)).length;
  if (matched >= 5) return 5;
  if (matched === 4) return 4;
  if (matched === 3) return 3;
  return 0;
}
