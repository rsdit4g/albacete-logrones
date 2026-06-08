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
export function addRankingEntry({ name, club, year, pct }) {
  const entry = { name: name || "Anónimo", club, year, pct, date: today(), ts: Date.now() };
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

// Four scoped boards for today's runs: overall, same club, same season, and the
// same club+season. `me` is the entry returned by addRankingEntry.
export function getDailyBoards(me) {
  let all = loadAll().filter(e => e.date === me.date);
  if (!all.some(e => isSame(e, me))) all = [...all, me]; // storage-disabled fallback
  return {
    all: buildBoard(all, me),
    club: buildBoard(all.filter(e => e.club === me.club), me),
    season: buildBoard(all.filter(e => e.year === me.year), me),
    clubSeason: buildBoard(all.filter(e => e.club === me.club && e.year === me.year), me),
  };
}
