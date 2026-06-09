import { REAL_SEASONS } from "./real-seasons.js";
import { relegationInfo } from "../game/relegation.js";

// SEASONS keyed by season start year (e.g. 1994 = 1994–95), built from the real
// historical dataset. Club identifiers throughout the game are full club names.
// Each season carries its relegation structure: `directSpots` bottom places go
// down directly, and `promocionSpots` places just above play the promoción.
export const SEASONS = Object.fromEntries(
  REAL_SEASONS.map(s => {
    const { direct, promocion } = relegationInfo(s.start);
    return [s.start, {
      label: s.label,
      divisionSize: s.divisionSize,
      pointsForWin: s.pointsForWin,
      finalTable: s.finalTable,
      topScorers: s.topScorers,
      directSpots: direct,
      promocionSpots: promocion,
    }];
  })
);
