import { createRng } from "./rng.js";
import { teamStrength } from "./strength.js";
import { projectedOverall } from "./aging.js";

// Map strength (0..100) to a points total scaled to the season's table.
// Strength 50 ~ mid-table; 100 ~ a few points above the real champion.
export function projectedPoints(strength, season) {
  const champ = season.finalTable[0].pts;
  const bottom = season.finalTable[season.finalTable.length - 1].pts;
  const span = Math.max(8, champ - bottom);
  // strength 30 -> bottom, strength 100 -> champ + small margin
  const t = Math.max(0, Math.min(1, (strength - 30) / 70));
  return Math.round(bottom + t * (span + 4));
}

// Insert your team into the real table by points; one real club drops off
// the bottom so the table stays divisionSize long.
export function insertIntoTable(season, yourPts, yourName) {
  const rows = season.finalTable.map(r => ({ ...r, isYou: false }));
  const you = { club: "__you", name: yourName, pts: yourPts, isYou: true };
  rows.push(you);
  rows.sort((a, b) => b.pts - a.pts);
  const trimmed = rows.slice(0, season.divisionSize);
  const position = trimmed.findIndex(r => r.isYou) + 1;
  // If your team was trimmed off (last), force it into the final place.
  if (position === 0) {
    trimmed[trimmed.length - 1] = you;
    return { table: trimmed, position: season.divisionSize };
  }
  return { table: trimmed, position };
}

// Plausible W/D/L/GF/GA consistent with points & points system, flavoured by strength.
// Guarantees the invariant W*pointsForWin + D === points exactly (D is derived
// from points and W, not estimated independently), and W + D + L === games.
export function deriveRecord(points, games, pointsForWin, strength, rng) {
  const drawRate = pointsForWin === 3 ? 0.22 : 0.26;
  // Estimate a plausible draw count, then solve wins around it.
  let D0 = Math.max(0, Math.min(games, Math.round(games * drawRate + (rng() * 4 - 2))));
  let W = Math.round((points - D0) / pointsForWin);
  W = Math.max(0, Math.min(games, W));
  // Force exact points: draws = points - wins*pointsForWin.
  let D = points - W * pointsForWin;
  while (D < 0 && W < games) { W += 1; D = points - W * pointsForWin; }
  D = Math.max(0, D);
  let L = games - W - D;
  if (L < 0) { D = Math.max(0, D + L); L = games - W - D; } // trim draws to fit games
  if (L < 0) { W = games - D; L = 0; }                       // last resort
  // Goals: scale with strength.
  const gf = Math.round(games * (0.8 + strength / 100));
  const ga = Math.round(games * (1.6 - strength / 100));
  return { P: games, W, D, L, GF: gf, GA: Math.max(0, ga), Pts: points };
}

// Project the XI's strength `yearsElapsed` seasons from draft, applying aging.
function strengthInSeason(picks, yearsElapsed) {
  const aged = picks.map(pk => ({
    slotId: pk.slotId,
    player: {
      ...pk.player,
      overall: projectedOverall(pk.player.overall, pk.player.age, yearsElapsed),
    },
  }));
  return teamStrength(aged);
}

// Resolve a single season into a SeasonResult.
export function simulateSeason(picks, season, year, yearsElapsed, rng, yourName) {
  const base = strengthInSeason(picks, yearsElapsed);
  // +/- variance up to ~4 strength points
  const strength = base + (rng() * 8 - 4);
  const games = (season.divisionSize - 1) * 2;
  let pts = projectedPoints(strength, season);
  const { table, position } = insertIntoTable(season, pts, yourName);
  const record = deriveRecord(pts, games, season.pointsForWin, strength, rng);

  // Cups: probability from strength.
  const honours = [];
  if (position === 1) honours.push("La Liga");
  if (rng() < Math.max(0, (strength - 60) / 80)) honours.push("Copa del Rey");

  // Top scorers: blend real list with your best forward (computed goals).
  const topScorers = season.topScorers.map(s => ({ ...s, isYou: false }));
  const myForward = picks
    .map(pk => pk.player)
    .filter(pl => pl.positions.some(p => ["ST", "CF"].includes(p)))
    .sort((a, b) => b.overall - a.overall)[0];
  if (myForward) {
    const goals = Math.round(8 + (strength / 100) * 22 + (rng() * 6 - 3));
    topScorers.push({ name: myForward.name, club: yourName, goals, isYou: true });
  }
  topScorers.sort((a, b) => b.goals - a.goals);

  return { year, position, record, honours, table, topScorers: topScorers.slice(0, 5) };
}

// Simulate five consecutive seasons from startYear. Seasons without data are
// skipped-forward using the nearest available season's shape.
export function simulateFiveYears(picks, startYear, { SEASONS }, seed, yourName = "Your XI") {
  const rng = createRng(seed);
  const results = [];
  const years = Object.keys(SEASONS).map(Number).sort((a, b) => a - b);
  for (let i = 0; i < 5; i++) {
    const year = startYear + i;
    // Use that year's data if present, else the closest available season's shape.
    const season = SEASONS[year] ||
      SEASONS[years.reduce((best, y) =>
        Math.abs(y - year) < Math.abs(best - year) ? y : best, years[0])];
    results.push(simulateSeason(picks, season, year, i, rng, yourName));
  }
  return results;
}
