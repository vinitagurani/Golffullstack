// src/lib/utils.js
export const POOL_CONTRIBUTION = 5;

export function calculatePrizePools(totalPool) {
  return {
    jackpot: +(totalPool * 0.4).toFixed(2),
    fourMatch: +(totalPool * 0.35).toFixed(2),
    threeMatch: +(totalPool * 0.25).toFixed(2),
  };
}
