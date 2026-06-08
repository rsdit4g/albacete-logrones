import { REAL_SEASONS } from "./real-seasons.js";

// Club display registry, derived from every club that appears in the real
// tables. Keyed by full club name; value carries the display name. (Club names
// are the canonical identifier used across seasons, squads, and the engine.)
export const CLUBS = {};
for (const season of REAL_SEASONS) {
  for (const row of season.finalTable) {
    if (!CLUBS[row.club]) CLUBS[row.club] = { name: row.club };
  }
}
