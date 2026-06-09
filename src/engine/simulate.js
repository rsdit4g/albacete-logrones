import { createRng } from "./rng.js";
import { teamStrength } from "./strength.js";
import { projectedMedia } from "./aging.js?v=3";

// Map strength (0..100) to a points total scaled to the season's table.
// Strength 50 ~ mid-table; 100 ~ a few points above the real champion.
export function projectedPoints(strength, season) {
  const champ = season.finalTable[0].pts;
  const bottom = season.finalTable[season.finalTable.length - 1].pts;
  const span = Math.max(8, champ - bottom);
  // Real squads' team strength clusters in ~64 (relegation-tier) to ~94 (elite),
  // so map THAT band onto the full table. The old 30→100 mapping left even weak
  // sides mid-table because the bottom 40% of the scale was never used.
  // 64 -> bottom of the table, 94 -> champion + a small margin.
  const t = Math.max(0, Math.min(1, (strength - 64) / 30));
  return Math.round(bottom + t * (span + 4));
}

// Insert your team into the real table by points. You ARE a real club, so if
// your club already appears in the table its real row is removed first (you
// replace it). The table stays divisionSize long.
export function insertIntoTable(season, yourPts, yourClub) {
  const rows = season.finalTable
    .filter(r => r.club !== yourClub)
    .map(r => ({ ...r, isYou: false }));
  const you = { club: yourClub, pts: yourPts, isYou: true };
  rows.push(you);
  rows.sort((a, b) => b.pts - a.pts);
  const trimmed = rows.slice(0, season.divisionSize);
  let position = trimmed.findIndex(r => r.isYou) + 1;
  // If your team was trimmed off the bottom, force it into the final place.
  if (position === 0) {
    trimmed[trimmed.length - 1] = you;
    position = season.divisionSize;
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
  // If results overflow the game count (too many draws), convert draws into wins.
  // Each win is worth pointsForWin points (= several draws), so one extra win frees
  // game slots while preserving the exact points invariant W*pointsForWin + D = points.
  while (L < 0 && D >= pointsForWin) { W += 1; D -= pointsForWin; L = games - W - D; }
  if (L < 0) L = 0; // unreachable for realistic inputs; guard against impossible totals
  // Goals: scale with strength.
  const gf = Math.round(games * (0.8 + strength / 100));
  const ga = Math.round(games * (1.6 - strength / 100));
  return { P: games, W, D, L, GF: gf, GA: Math.max(0, ga), Pts: points };
}

// Project the XI's strength `yearsElapsed` seasons from draft, aging each
// player's composite rating along the age curve.
function strengthInSeason(picks, yearsElapsed) {
  return teamStrength(picks, (pick) => projectedMedia(pick.player, yearsElapsed));
}

// Resolve a single season into a SeasonResult. `yourClub` is the real club name
// the player is managing (used to label rows and replace the real row).
// `form` is an externally-supplied seasonal variance (smoothed by simulateFiveYears)
// so year-to-year positions drift gradually rather than jumping wildly.
export function simulateSeason(picks, season, year, yearsElapsed, rng, yourClub, form = 0) {
  const base = strengthInSeason(picks, yearsElapsed);
  const strength = Math.min(99, Math.max(20, base + form));
  const games = (season.divisionSize - 1) * 2;
  const pts = projectedPoints(strength, season);
  const { table, position } = insertIntoTable(season, pts, yourClub);
  const record = deriveRecord(pts, games, season.pointsForWin, strength, rng);

  // League title.
  const honours = [];
  if (position === 1) honours.push("La Liga");

  // Copa del Rey: every season produces a run, depth scaling with strength.
  const copaRound = copaRun(strength, rng);

  // Relegation: bottom `relSpots` positions go down.
  const relSpots = relegationSpots(season);
  const relegated = position > season.divisionSize - relSpots;

  // Supercopa: contested if you won the league or the cup this season.
  let supercopa = null;
  if (honours.includes("La Liga") || copaRound === "Campeón") {
    supercopa = supercopaResult(strength, rng);
  }

  // Top scorers: real scorers get mild per-season noise so the order varies.
  const topScorers = season.topScorers.map(sc => ({
    ...sc,
    goals: Math.max(6, sc.goals + Math.round(rng() * 8 - 4)),
    isYou: false,
  }));
  // EVERY one of your players gets a projected tally from their position, their
  // (aged) quality, and the squad's overall strength — so any of them can chart,
  // not just one striker. They then compete with the real scorers for the top 5.
  for (const pick of picks) {
    const aged = projectedMedia(pick.player, yearsElapsed);
    const goals = projectedGoals(pick.player.pos, aged, strength, rng);
    if (goals < 3) continue;
    // If this player is also in the real top-scorer list (you drafted someone
    // who really scored that year), don't duplicate them — claim that row as
    // yours and use the projected tally (consistent with your squad's context).
    const dupe = topScorers.find(s => s.name === pick.player.name);
    if (dupe) {
      dupe.isYou = true;
      dupe.club = yourClub;
      dupe.goals = goals;
    } else {
      topScorers.push({ name: pick.player.name, club: yourClub, goals, isYou: true });
    }
  }
  topScorers.sort((a, b) => b.goals - a.goals);

  return {
    year, position, record, honours, copaRound, supercopa,
    relegated, relegationSpots: relSpots, inSegunda: false,
    pointsForWin: season.pointsForWin,
    table, topScorers: topScorers.slice(0, 5),
  };
}

// Number of relegation places: 4 in the 22-team seasons (1995–97), else 3.
function relegationSpots(season) {
  return season.divisionSize >= 22 ? 4 : 3;
}

// Supercopa final: win probability scales with team strength (a strong side
// usually wins, but it's a single match so upsets happen). Returns the result.
function supercopaResult(strength, rng) {
  const winProb = Math.max(0.15, Math.min(0.9, 0.3 + (strength - 50) / 110));
  return rng() < winProb ? "Campeón" : "Subcampeón";
}

// A placeholder result for a season spent in Segunda after relegation: no league
// table, 0 La Liga points, but the season still counts toward the 5-year maximum.
function segundaSeason(year, season) {
  const games = (season.divisionSize - 1) * 2;
  return {
    year, position: null,
    record: { P: games, W: 0, D: 0, L: games, GF: 0, GA: 0, Pts: 0 },
    honours: [], copaRound: null, supercopa: null,
    relegated: true, relegationSpots: relegationSpots(season), inSegunda: true,
    pointsForWin: season.pointsForWin,
    table: [], topScorers: [],
  };
}

// Copa del Rey rounds, shallowest → deepest. "Campeón" is winning the cup.
export const COPA_ROUNDS = [
  "Dieciseisavos", "Octavos", "Cuartos", "Semifinales", "Final", "Campeón",
];

// Resolve how far your team goes in the Copa. Depth scales with strength, with
// random noise so a strong side can still get knocked out early (and a weak one
// occasionally goes on a run). Returns one of COPA_ROUNDS.
function copaRun(strength, rng) {
  const t = (strength - 20) / 80;            // 0 (weak) .. 1 (elite)
  const noise = rng() * 0.7 - 0.35;          // ±0.35 cup-draw luck
  const score = Math.max(0, Math.min(1, t * 0.85 + noise));
  const idx = Math.round(score * (COPA_ROUNDS.length - 1));
  return COPA_ROUNDS[idx];
}

// How much each position contributes to goals (strikers most, keepers ~never).
const POS_GOAL_WEIGHT = { AT: 1.0, MF: 0.42, DF: 0.13, GK: 0.02 };

// Projected league goals for one of your players in a season, driven by:
//   • position    — strikers score, midfielders chip in, defenders rarely
//   • quality      — the player's (aged) rating; calidad/finishing is baked into it
//   • squad strength — a stronger side creates more chances to convert
// A small ±12% wobble keeps seasons from being identical without being random.
// An elite striker on a top side lands ~26–30; a good midfielder ~8–12; a
// defender ~1–3; weak players score little and won't trouble the real scorers.
function projectedGoals(pos, agedRating, teamStrength, rng) {
  const posW = POS_GOAL_WEIGHT[pos] ?? 0.1;
  const quality = Math.max(0, Math.min(1.2, (agedRating - 50) / 45)); // 50→0, 95→1.0
  const squad = 0.7 + Math.max(0, Math.min(1, (teamStrength - 64) / 30)) * 0.6; // 0.7..1.3
  const wobble = 0.88 + rng() * 0.24; // ±12%
  return Math.max(0, Math.round(24 * posW * quality * squad * wobble));
}

// Simulate five consecutive seasons from startYear. Seasons without data are
// skipped-forward using the nearest available season's shape.
// Form is a mean-reverting autocorrelated variable (ρ=0.5) so positions drift
// gradually — big swings require sustained bad/good form across multiple years.
export function simulateFiveYears(picks, startYear, { SEASONS }, seed, yourClub = "__you") {
  const rng = createRng(seed);
  const results = [];
  const years = Object.keys(SEASONS).map(Number).sort((a, b) => a - b);
  // Initialise form with one draw so first season isn't always neutral.
  let form = rng() * 6 - 3;

  let relegated = false;
  for (let i = 0; i < 5; i++) {
    const year = startYear + i;
    // Use that year's data if present, else the closest available season's shape.
    const season = SEASONS[year] ||
      SEASONS[years.reduce((best, y) =>
        Math.abs(y - year) < Math.abs(best - year) ? y : best, years[0])];

    // Once relegated, the run is effectively over: remaining years are spent in
    // Segunda with 0 La Liga points (still counted toward the 5-year maximum).
    if (relegated) {
      results.push(segundaSeason(year, season));
      continue;
    }

    // Form drifts: 50% autocorrelation keeps swings moderate; hard-clamp ±6.
    form = Math.max(-6, Math.min(6, form * 0.5 + (rng() * 6 - 3)));

    const res = simulateSeason(picks, season, year, i, rng, yourClub, form);
    results.push(res);
    if (res.relegated) relegated = true;
  }
  return results;
}
