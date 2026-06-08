import { REAL_SEASONS } from "./real-seasons.js";

// SEASONS keyed by season start year (e.g. 1994 = 1994–95), built from the real
// historical dataset. Club identifiers throughout the game are full club names.
export const SEASONS = Object.fromEntries(
  REAL_SEASONS.map(s => [s.start, {
    label: s.label,
    divisionSize: s.divisionSize,
    pointsForWin: s.pointsForWin,
    finalTable: s.finalTable,
    topScorers: s.topScorers,
  }])
);
