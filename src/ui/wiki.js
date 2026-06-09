import { REAL_SEASONS } from "../data/real-seasons.js";
import { CLUBS } from "../data/clubs.js?v=16";

// Escape text before interpolating into innerHTML.
function esc(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

const clubName = (c) => CLUBS[c]?.name || c;

// A browsable "wiki" of the real La Liga results behind the game: the actual
// final table and top scorers for every season in the dataset.
// `onBack` returns to the previous screen; `startYear` optionally opens on a
// specific season.
export function renderWiki(root, onBack, startYear) {
  const seasons = REAL_SEASONS;
  let idx = Math.max(0, seasons.findIndex(s => s.start === startYear));
  if (idx === -1) idx = 0;

  function paint() {
    const s = seasons[idx];
    const relSpots = s.divisionSize >= 22 ? 4 : 3;
    root.innerHTML = `
      <section class="screen wiki">
        <button class="setup-back" id="wikiBack">← Volver</button>
        <h1 class="brand">Gol De <span>Oro</span></h1>
        <h2 class="brand-sub">Histórico real</h2>
        <p class="tagline">Así terminó La Liga en la vida real. Estas son las tablas que el juego usa para simular tus temporadas.</p>

        <div class="rs-nav">
          <button id="wprev" ${idx === 0 ? "disabled" : ""}>◀</button>
          <div class="rs-title"><b>${esc(s.label)}</b><small>PRIMERA DIVISIÓN · ${s.divisionSize} EQUIPOS</small></div>
          <button id="wnext" ${idx === seasons.length - 1 ? "disabled" : ""}>▶</button>
        </div>

        <div class="rs-grid">
          <div>
            <div class="rs-h">Clasificación final</div>
            <table class="rs-tbl">
              ${s.finalTable.map((row, i) => {
                const relZone = i >= s.finalTable.length - relSpots;
                const champ = i === 0;
                return `<tr class="${champ ? "me" : ""} ${relZone ? "rel" : ""}">
                  <td class="p">${i + 1}</td><td>${esc(clubName(row.club))}</td><td class="pts">${row.pts}</td></tr>`;
              }).join("")}
            </table>
            <div class="rs-rellegend">▼ Descendieron los ${relSpots} últimos · ${s.pointsForWin} pts por victoria</div>
          </div>
          <div>
            <div class="rs-h">Máximos goleadores</div>
            <table class="rs-sc">
              ${s.topScorers.map(sc =>
                `<tr><td>${esc(sc.name)}<div class="cl">${esc(clubName(sc.club))}</div></td><td class="g">${sc.goals}</td></tr>`).join("")}
            </table>
          </div>
        </div>

        <div class="wiki-jump">
          ${seasons.map((ss, i) => `<button class="wk-yr ${i === idx ? "on" : ""}" data-i="${i}">${esc(ss.label.split("–")[0])}</button>`).join("")}
        </div>
      </section>`;

    root.querySelector("#wikiBack").addEventListener("click", onBack);
    root.querySelector("#wprev").addEventListener("click", () => { if (idx > 0) { idx--; paint(); } });
    root.querySelector("#wnext").addEventListener("click", () => { if (idx < seasons.length - 1) { idx++; paint(); } });
    root.querySelectorAll(".wk-yr").forEach(b =>
      b.addEventListener("click", () => { idx = Number(b.dataset.i); paint(); }));
  }

  paint();
}
