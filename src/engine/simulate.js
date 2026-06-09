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

  // Relegation, with the historical promoción play-off where applicable.
  // Bottom `directSpots` go down directly; the `promocionSpots` places just above
  // play a two-legged tie vs a Segunda side (a La Liga side is usually, but not
  // always, favoured — scaled by strength).
  const directSpots = season.directSpots ?? (season.divisionSize >= 22 ? 4 : 3);
  const promocionSpots = season.promocionSpots ?? 0;
  const directCut = season.divisionSize - directSpots;   // pos > directCut → direct drop
  const promoCut = directCut - promocionSpots;           // promoCut < pos ≤ directCut → play-off
  let relegated = false, promocion = false, promocionSurvived = null;
  if (position > directCut) {
    relegated = true;
  } else if (promocionSpots > 0 && position > promoCut) {
    promocion = true;
    const surviveProb = Math.max(0.3, Math.min(0.82, 0.5 + (strength - 64) / 120));
    promocionSurvived = rng() < surviveProb;
    relegated = !promocionSurvived;
  }

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
  // Your players' goal tallies. Compute each player's raw expected goals, then
  // damp everyone except your single best scorer so goals concentrate in one (or
  // at most two) players — like real life, where a team almost never has several
  // men all topping the charts. Without this, drafting two elite strikers gave
  // two implausibly huge tallies.
  const myGoals = picks.map(pick => ({
    pick,
    raw: rawGoals(pick.player.pos, projectedMedia(pick.player, yearsElapsed), strength, rng),
  }));
  myGoals.sort((a, b) => b.raw - a.raw);
  const SCORER_DAMP = [1.0, 0.62, 0.42, 0.3, 0.22]; // by rank within your XI
  myGoals.forEach((g, rank) => {
    const goals = Math.round(g.raw * (SCORER_DAMP[Math.min(rank, SCORER_DAMP.length - 1)] ?? 0.2));
    if (goals < 3) return;
    const name = g.pick.player.name;
    // If you drafted someone who really scored that year, claim that row rather
    // than duplicating them, using the projected tally for your squad's context.
    const dupe = topScorers.find(s => s.name === name);
    if (dupe) {
      dupe.isYou = true;
      dupe.club = yourClub;
      dupe.goals = goals;
    } else {
      topScorers.push({ name, club: yourClub, goals, isYou: true });
    }
  });
  topScorers.sort((a, b) => b.goals - a.goals);

  return {
    year, position, record, honours, copaRound, supercopa,
    relegated, promocion, promocionSurvived,
    directSpots, promocionSpots,
    relegationSpots: directSpots + promocionSpots, // total drop-zone size (legacy)
    inSegunda: false,
    pointsForWin: season.pointsForWin,
    table, topScorers: topScorers.slice(0, 5),
  };
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
  const directSpots = season.directSpots ?? (season.divisionSize >= 22 ? 4 : 3);
  const promocionSpots = season.promocionSpots ?? 0;
  return {
    year, position: null,
    record: { P: games, W: 0, D: 0, L: games, GF: 0, GA: 0, Pts: 0 },
    honours: [], copaRound: null, supercopa: null,
    relegated: true, promocion: false, promocionSurvived: null,
    directSpots, promocionSpots, relegationSpots: directSpots + promocionSpots,
    inSegunda: true,
    pointsForWin: season.pointsForWin,
    table: [], topScorers: [],
  };
}

// Copa del Rey rounds, shallowest → deepest. "Campeón" is winning the cup.
// A longer ladder (more rounds) makes the title harder to reach.
export const COPA_ROUNDS = [
  "Primera ronda", "Treintaidosavos", "Dieciseisavos", "Octavos",
  "Cuartos", "Semifinales", "Final", "Campeón",
];

// Resolve how far your team goes in the Copa. Depth scales with strength, with
// random noise so a strong side can still get knocked out early (and a weak one
// occasionally goes on a run). Returns one of COPA_ROUNDS.
// Winning is deliberately hard: even an elite side averages a semifinal exit, so
// lifting the cup needs both quality AND a kind draw — deep runs are common,
// trophies are rare.
function copaRun(strength, rng) {
  const t = (strength - 20) / 80;            // 0 (weak) .. 1 (elite)
  const noise = rng() * 0.7 - 0.35;          // ±0.35 cup-draw luck
  const score = Math.max(0, Math.min(1, t * 0.72 + noise - 0.02));
  const idx = Math.round(score * (COPA_ROUNDS.length - 1));
  return COPA_ROUNDS[idx];
}

// How much each position contributes to goals (strikers most, keepers never).
const POS_GOAL_WEIGHT = { AT: 1.0, MF: 0.38, DF: 0.10, GK: 0 };

// Raw expected league goals for one of your players before the per-team scorer
// damping above. Driven by position, the player's (aged) quality, and squad
// strength. Tuned conservatively: an elite striker's RAW lands ~24–27 (and only
// the team's top scorer keeps it; others are damped), a good midfielder ~7–10,
// a defender ~1–3. Returns a float; the caller rounds after damping.
function rawGoals(pos, agedRating, teamStrength, rng) {
  const posW = POS_GOAL_WEIGHT[pos] ?? 0.1;
  const quality = Math.max(0, Math.min(1, (agedRating - 55) / 40)); // 55→0, 95→1.0
  const squad = 0.75 + Math.max(0, Math.min(1, (teamStrength - 66) / 28)) * 0.5; // 0.75..1.25
  const wobble = 0.85 + rng() * 0.3; // ±15%
  return Math.max(0, 22 * posW * quality * squad * wobble);
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
