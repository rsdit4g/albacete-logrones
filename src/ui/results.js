import { CLUBS } from "../data/clubs.js";

// Escape text before interpolating into innerHTML (teamName is free user input).
function esc(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// Renders the season-by-season results. `seasons` is the SeasonResult[] from
// simulateFiveYears; teamName is the player's club name.
export function renderResults(root, seasons, teamName, onAgain) {
  let idx = 0;
  const safeTeam = esc(teamName);

  // Display name for a table/scorer row, escaped. Your team for `isYou` rows.
  function clubName(row) {
    return row.isYou ? safeTeam : esc(CLUBS[row.club]?.name || row.club);
  }

  function ordinal(n) {
    const s = ["th", "st", "nd", "rd"], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  function paint() {
    const r = seasons[idx];
    const rec = r.record;
    root.innerHTML = `
      <section class="screen results">
        <div class="rs-nav">
          <button id="prev" ${idx === 0 ? "disabled" : ""}>◀</button>
          <div class="rs-title">
            <b>${r.year} / ${(r.year + 1) % 100}</b>
            <small>${esc(teamName.toUpperCase())} · SEASON ${idx + 1} OF 5</small>
          </div>
          <button id="next" ${idx === seasons.length - 1 ? "disabled" : ""}>▶</button>
        </div>
        <div class="rs-dots">${seasons.map((_, i) =>
          `<i class="${i === idx ? "on" : ""}"></i>`).join("")}</div>

        <div class="rs-banner">
          <div class="rs-rank">${ordinal(r.position)}</div>
          <div class="rs-rec">
            <b>${safeTeam}</b><br>
            P${rec.P} · ${rec.W}W ${rec.D}D ${rec.L}L · ${rec.GF}–${rec.GA} · <b>${rec.Pts} pts</b>
          </div>
        </div>

        <div class="rs-grid">
          <div>
            <div class="rs-h">Final table</div>
            <table class="rs-tbl">${r.table.map((row, i) =>
              `<tr class="${row.isYou ? "me" : ""}"><td class="p">${i + 1}</td>
               <td>${clubName(row)}</td><td class="pts">${row.pts}</td></tr>`).join("")}
            </table>
          </div>
          <div>
            <div class="rs-h">Top scorers</div>
            <table class="rs-sc">${r.topScorers.map(s =>
              `<tr class="${s.isYou ? "me" : ""}"><td>${esc(s.name)}<div class="cl">${clubName(s)}</div></td>
               <td class="g">${s.goals}</td></tr>`).join("")}
            </table>
            <div class="rs-h" style="margin-top:12px">Honours</div>
            <div class="rs-hon">${r.honours.length ? r.honours.map(h => `🏆 ${h}`).join("<br>") : "—"}</div>
          </div>
        </div>

        <button id="again" class="primary">Build another XI</button>
      </section>`;

    root.querySelector("#prev").addEventListener("click", () => { if (idx > 0) { idx--; paint(); } });
    root.querySelector("#next").addEventListener("click", () => { if (idx < seasons.length - 1) { idx++; paint(); } });
    root.querySelector("#again").addEventListener("click", onAgain);
  }
  paint();
}
