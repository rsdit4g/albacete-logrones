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

// Every club that appears in Primera anywhere in the dataset — used to tell a
// genuine Segunda season (club exists, just not in this year's top flight) apart
// from "no data" (club outside the dataset's 1990–2009 window entirely).
const KNOWN_CLUBS = new Set(REAL_SEASONS.flatMap(s => s.finalTable.map(r => r.club)));

// Real-life status of a club in a season, for the head-to-head comparison:
//   { inPrimera: true, position, pts, of }   — finished in the top flight
//   { inPrimera: false, inSegunda: true }    — known club, but down in Segunda
//   { inPrimera: false, inSegunda: false }   — no data (outside the window)
export function realClubStatus(club, year) {
  const r = realClubResult(club, year);
  if (r) return { inPrimera: true, ...r };
  // Year is covered by the dataset AND the club exists in it → it was in Segunda.
  const inSegunda = !!BY_YEAR[year] && KNOWN_CLUBS.has(club);
  return { inPrimera: false, inSegunda };
}
