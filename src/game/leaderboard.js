// Local daily leaderboard, persisted in localStorage. Each completed run can be
// saved with a player name; boards are scoped to "today" and ranked by points %.
//
// NOTE: this is a per-browser store (no backend), so "Ranking del día" reflects
// every run played on this device today. A shared/global ranking would need a server.

const KEY = "al_rankings_v1";

function loadAll() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; }
  catch { return []; }
}

function saveAll(list) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); }
  catch { /* storage disabled or full — run still shows in-memory */ }
}

function today() {
  // Local calendar date, YYYY-MM-DD.
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

// Persist a finished run. Returns the stored entry (carries a unique ts).
// `mode` ("clasico" | "maldiniano") scopes the ranking so the two play modes
// compete on separate boards.
export function addRankingEntry({ name, club, year, pct, mode }) {
  const entry = { name: name || "Anónimo", club, year, pct, mode: mode || "clasico", date: today(), ts: Date.now() };
  const list = loadAll();
  list.push(entry);
  saveAll(list);
  return entry;
}

function isSame(a, b) {
  return a.ts === b.ts && a.name === b.name;
}

// Sort by points % desc, earlier submission wins ties. Tag the player's row,
// and report their 1-based rank and the field size.
function buildBoard(entries, me) {
  const sorted = [...entries].sort((a, b) => b.pct - a.pct || a.ts - b.ts);
  const myRank = sorted.findIndex(e => isSame(e, me)) + 1;
  return { sorted, myRank, total: sorted.length };
}

// Break a pool of entries into the four scopes: overall, same team (club), same
// season (year), and the same team+season. Every breakdown the game shows comes
// from this — combined with the mode/date filters applied by the callers, the
// store is queryable by mode, date, team and year.
function scopedBoards(entries, me) {
  return {
    all: buildBoard(entries, me),
    club: buildBoard(entries.filter(e => e.club === me.club), me),
    season: buildBoard(entries.filter(e => e.year === me.year), me),
    clubSeason: buildBoard(entries.filter(e => e.club === me.club && e.year === me.year), me),
  };
}

// Today's runs, scoped to one mode. Defaults to the player's own mode, but a
// `viewMode` can be passed to browse another mode's board. The player's own entry
// is only injected into the pool when viewing their own mode.
export function getDailyBoards(me, viewMode = me.mode || "clasico") {
  let pool = loadAll().filter(e => e.date === me.date && (e.mode || "clasico") === viewMode);
  if (viewMode === (me.mode || "clasico") && !pool.some(e => isSame(e, me))) pool = [...pool, me];
  return scopedBoards(pool, me);
}

// All-time runs (every date), scoped to one mode (defaults to the player's own).
export function getAllTimeBoards(me, viewMode = me.mode || "clasico") {
  let pool = loadAll().filter(e => (e.mode || "clasico") === viewMode);
  if (viewMode === (me.mode || "clasico") && !pool.some(e => isSame(e, me))) pool = [...pool, me];
  return scopedBoards(pool, me);
}
