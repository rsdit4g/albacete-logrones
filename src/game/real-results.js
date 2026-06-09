import { REAL_SEASONS } from "../data/real-seasons.js";

// Real La Liga results keyed by season start year, for quick lookup.
const BY_YEAR = Object.fromEntries(REAL_SEASONS.map(s => [s.start, s]));

// The real season record (final table etc.) for a start year, or null.
export function realSeason(year) {
  return BY_YEAR[year] || null;
}

// How a real club actually finished a given season: { position, pts, of }.
// Returns null if the club was not in Primera that year (e.g. in Segunda).
export function realClubResult(club, year) {
  const season = BY_YEAR[year];
  if (!season) return null;
  const i = season.finalTable.findIndex(r => r.club === club);
  if (i === -1) return null;
  return { position: i + 1, pts: season.finalTable[i].pts, of: season.finalTable.length };
}
