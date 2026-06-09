import { CLUBS } from "../data/clubs.js?v=16";
import { addRankingEntry, getDailyBoards } from "../game/leaderboard.js?v=23";
import { pitchSlotsHTML, teamMedia, teamMediaEnd } from "./pitch.js?v=2";
import { realClubResult } from "../game/real-results.js?v=1";

// Deployment domain is unchanged; only the displayed brand is "Gol De Oro".
const SHARE_URL = "https://albacete-logrones.io";

// Brand glyphs (inline SVG, fill uses each button's text colour) for the share row.
const ICONS = {
  whatsapp: `<svg class="sh-ico" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.683-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.511 5.26l-.999 3.648 3.477-.607zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.166-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.612-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/></svg>`,
  facebook: `<svg class="sh-ico" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`,
  x: `<svg class="sh-ico" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932 6.064-6.933zm-1.291 19.5h2.039L6.486 3.24H4.298l13.312 17.413z"/></svg>`,
  instagram: `<svg class="sh-ico" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>`,
};

// Escape text before interpolating into innerHTML.
function esc(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function ordinal(n) {
  return n + "º";
}

// Verdict category. It never claims a championship you didn't win: "CAMPEÓN"
// and "DINASTÍA" require actual league titles. Sides that never won the league
// are judged by points efficiency (and flagged if relegated).
function verdictTier(pct, titles, relegatedEver) {
  if (titles >= 3) return "DINASTÍA";
  if (titles >= 1) return "CAMPEÓN";
  if (relegatedEver) return "DESCENSO";
  if (pct >= 68) return "ASPIRANTE";
  if (pct >= 52) return "ZONA EUROPA";
  if (pct >= 38) return "MEDIA TABLA";
  if (pct >= 24) return "ZONA BAJA";
  return "SUFRIMIENTO";
}

// Renders the season-by-season results + a five-year summary + sharing.
// `yourClub` is the real club name the player managed.
export function renderResults(root, seasons, yourClub, picks, mode, onAgain) {
  let idx = 0;
  const displayName = CLUBS[yourClub]?.name || yourClub;
  const safeName = esc(displayName);
  const startYear = seasons[0].year;
  const modeLabel = mode === "maldiniano" ? "Maldiniano" : "Clásico";

  // Leaderboard state: filled once the player saves their run.
  let myEntry = null;
  let boards = null;
  let rankTab = "all";
  let showReal = false; // real-life comparison toggle

  const clubAbbr = (c) => CLUBS[c]?.abbr || c.slice(0, 3).toUpperCase();
  const yy = (year) => `'${String(year % 100).padStart(2, "0")}`;
  const seasonLabel = (y) => `${y}–${String((y + 1) % 100).padStart(2, "0")}`;

  // Positions only exist for seasons actually played in La Liga.
  const playedPositions = seasons.filter(s => !s.inSegunda).map(s => s.position);
  const best = playedPositions.length ? Math.min(...playedPositions) : null;
  const worst = playedPositions.length ? Math.max(...playedPositions) : null;
  const titles = seasons.filter(s => s.honours.includes("La Liga")).length;
  const cups = seasons.filter(s => s.copaRound === "Campeón").length;
  const supercopas = seasons.filter(s => s.supercopa === "Campeón").length;
  const relegatedEver = seasons.some(s => s.relegated);

  // Five-year points efficiency: total points won / max attainable points.
  const totalPts = seasons.reduce((a, s) => a + s.record.Pts, 0);
  const maxPts = seasons.reduce((a, s) => a + s.record.P * s.pointsForWin, 0);
  const pct = maxPts > 0 ? Math.round((totalPts / maxPts) * 100) : 0;
  const tier = verdictTier(pct, titles, relegatedEver);

  function clubLabel(code) {
    return code === yourClub ? safeName : esc(CLUBS[code]?.name || code);
  }

  function shareText() {
    const arc = seasons.map(s => s.inSegunda ? "2ª" : `${s.position}º`).join(" · ");
    const honours = titles ? `, ${titles}× Liga` : "";
    return `⚽ ${displayName} en Gol De Oro: ${arc} en 5 temporadas. ` +
           `${pct}% de los puntos${honours} (${tier}). ¿Puedes mejorarlo? ${SHARE_URL}`;
  }

  function openShare(network) {
    const text = encodeURIComponent(shareText());
    const url = encodeURIComponent(SHARE_URL);
    const links = {
      whatsapp: `https://wa.me/?text=${text}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`,
      x: `https://twitter.com/intent/tweet?text=${text}`,
    };
    window.open(links[network], "_blank", "noopener,noreferrer");
  }

  // Draw a square share card to a canvas and trigger a PNG download (Instagram).
  function downloadImage() {
    const W = 1080, H = 1080;
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const g = c.getContext("2d");
    g.fillStyle = "#0a0a12"; g.fillRect(0, 0, W, H);
    g.fillStyle = "#f5d040";
    g.font = "800 40px Inter, system-ui, sans-serif";
    g.textAlign = "center";
    g.fillText("GOL DE ORO", W / 2, 120);
    g.fillStyle = "#fff";
    g.font = "900 84px Inter, system-ui, sans-serif";
    g.fillText(displayName, W / 2, 240);
    g.fillStyle = "#9be29b";
    g.font = "800 30px Inter, system-ui, sans-serif";
    g.fillText(tier, W / 2, 300);
    // five position pills
    const pillW = 170, gap = 24, totalW = 5 * pillW + 4 * gap;
    let x = (W - totalW) / 2;
    const y = 430, ph = 210;
    seasons.forEach((s) => {
      const champ = s.position === 1;
      const down = s.inSegunda || s.relegated;
      g.fillStyle = champ ? "#3a2f00" : down ? "#2a1414" : "#161622";
      g.strokeStyle = champ ? "#f5d040" : down ? "#7a2a2a" : "#2a2a3a";
      g.lineWidth = 3;
      roundRect(g, x, y, pillW, ph, 18); g.fill(); g.stroke();
      g.fillStyle = champ ? "#f5d040" : down ? "#ff9b9b" : "#fff";
      g.font = "900 76px Inter, system-ui, sans-serif";
      g.textAlign = "center";
      g.fillText(s.inSegunda ? "2ª" : String(s.position), x + pillW / 2, y + 110);
      g.fillStyle = "#9aa";
      g.font = "600 26px Inter, system-ui, sans-serif";
      g.fillText(`'${String(s.year % 100).padStart(2, "0")}`, x + pillW / 2, y + 160);
      x += pillW + gap;
    });
    g.fillStyle = "#f5d040";
    g.font = "800 52px Inter, system-ui, sans-serif";
    g.fillText(`${pct}% de los puntos posibles`, W / 2, 740);
    g.fillStyle = "#cfcfe0";
    g.font = "600 34px Inter, system-ui, sans-serif";
    const bestTxt = best != null ? `Mejor: ${best}º` : "Descendido";
    g.fillText(`${bestTxt}   ·   ${titles}× Liga   ·   ${cups}× Copa`, W / 2, 800);
    g.fillStyle = "#666";
    g.font = "600 30px Inter, system-ui, sans-serif";
    g.fillText(SHARE_URL.replace("https://", ""), W / 2, 1000);

    c.toBlob((blob) => {
      if (!blob) return; // browser declined to produce the image
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${displayName.replace(/\s+/g, "-")}-5-temporadas.png`;
      a.click();
      URL.revokeObjectURL(a.href);
    });
  }

  function paint() {
    const r = seasons[idx];
    const rec = r.record;
    root.innerHTML = `
      <section class="screen results">
        <div class="rs-nav">
          <button id="prev" ${idx === 0 ? "disabled" : ""}>◀</button>
          <div class="rs-title">
            <b>${r.year} / ${String((r.year + 1) % 100).padStart(2, "0")}</b>
            <small>${safeName.toUpperCase()} · TEMPORADA ${idx + 1} DE 5</small>
          </div>
          <button id="next" ${idx === seasons.length - 1 ? "disabled" : ""}>▶</button>
        </div>
        <div class="rs-dots">${seasons.map((_, i) => `<i class="${i === idx ? "on" : ""}"></i>`).join("")}</div>

        ${r.inSegunda ? `
        <div class="rs-banner rs-banner-down">
          <div class="rs-rank">2ª</div>
          <div class="rs-rec">
            <b>${safeName}</b><br>
            En Segunda División tras el descenso · <b>0 pts</b> en La Liga
          </div>
        </div>
        <div class="rs-relnote">Tu equipo descendió y no compite esta temporada en Primera.</div>
        ` : `
        <div class="rs-banner${r.relegated ? " rs-banner-down" : ""}">
          <div class="rs-rank">${ordinal(r.position)}${r.relegated ? " ↓" : ""}</div>
          <div class="rs-rec">
            <b>${safeName}</b>${r.relegated ? " · <span class='rel-tag'>DESCENSO</span>" : ""}<br>
            P${rec.P} · ${rec.W}V ${rec.D}E ${rec.L}D · ${rec.GF}–${rec.GA} · <b>${rec.Pts} pts</b>
          </div>
        </div>

        <div class="rs-grid">
          <div>
            <div class="rs-h">Clasificación final</div>
            <table class="rs-tbl">${r.table.map((row, i) => {
              const relZone = i >= r.table.length - r.relegationSpots;
              return `<tr class="${row.isYou ? "me" : ""} ${relZone ? "rel" : ""}"><td class="p">${i + 1}</td>
               <td>${clubLabel(row.club)}</td><td class="pts">${row.pts}</td></tr>`;
            }).join("")}
            </table>
            <div class="rs-rellegend">▼ Zona de descenso (${r.relegationSpots} últimos)</div>
          </div>
          <div>
            <div class="rs-h">Máximos goleadores</div>
            <table class="rs-sc">${r.topScorers.map(s =>
              `<tr class="${s.isYou ? "me" : ""}"><td>${esc(s.name)}<div class="cl">${clubLabel(s.club)}</div></td>
               <td class="g">${s.goals}</td></tr>`).join("")}
            </table>
            <div class="rs-h" style="margin-top:12px">Títulos y copas</div>
            <div class="rs-hon">
              ${r.honours.includes("La Liga") ? `🏆 La Liga<br>` : ""}
              ${r.copaRound === "Campeón"
                ? `🏆 Copa del Rey<br>`
                : `Copa del Rey: <b>${esc(r.copaRound)}</b><br>`}
              ${r.supercopa
                ? (r.supercopa === "Campeón"
                    ? `🏆 Supercopa`
                    : `Supercopa: <b>Subcampeón</b>`)
                : ""}
            </div>
          </div>
        </div>
        `}

        <div class="rs-summary">
          <div class="rs-h">Resumen · 5 temporadas</div>
          <div class="rs-verdict">${tier}</div>
          <div class="rs-score"><b>${pct}%</b> de los puntos posibles <small>(${totalPts}/${maxPts})</small></div>
          <div class="rs-pills">
            ${seasons.map((s, i) => `
              <button class="rs-pill ${s.position === 1 ? "win" : ""} ${(s.inSegunda || s.relegated) ? "down" : ""} ${i === idx ? "cur" : ""}" data-i="${i}">
                <b>${s.inSegunda ? "2ª" : s.position}</b><small>'${String(s.year % 100).padStart(2, "0")}</small>
              </button>`).join("")}
          </div>
          <div class="rs-summary-stats">
            ${best != null ? `Mejor: ${ordinal(best)} · Peor: ${ordinal(worst)}` : "Sin temporadas en Primera"}${relegatedEver ? " · ⚠️ Descenso" : ""}
          </div>
          <div class="rs-trophies">
            ${titles ? `<span class="rs-tr"><i>Liga</i> ${"🏆".repeat(titles)}</span>` : ""}
            ${cups ? `<span class="rs-tr"><i>Copa</i> ${"🏆".repeat(cups)}</span>` : ""}
            ${supercopas ? `<span class="rs-tr"><i>Supercopa</i> ${"🏆".repeat(supercopas)}</span>` : ""}
            ${(titles + cups + supercopas) === 0 ? `<span class="rs-tr-none">Sin títulos en 5 temporadas</span>` : ""}
          </div>
        </div>

        <div class="rs-squad">
          <div class="rs-h">Tu once · Media del equipo <b class="rs-team-media">${teamMedia(picks)} → ${teamMediaEnd(picks)}</b></div>
          <div class="pitch rs-pitch">${pitchSlotsHTML(picks, { showMedia: true })}</div>
        </div>

        ${realComparisonSection()}

        ${rankingSection()}

        <div class="rs-share">
          <div class="rs-h">Comparte tu resultado</div>
          <div class="rs-share-btns">
            <button class="sh sh-wa" data-net="whatsapp">${ICONS.whatsapp}<span>WhatsApp</span></button>
            <button class="sh sh-fb" data-net="facebook">${ICONS.facebook}<span>Facebook</span></button>
            <button class="sh sh-x" data-net="x">${ICONS.x}<span>X</span></button>
            <button class="sh sh-ig" id="igBtn">${ICONS.instagram}<span>Imagen</span></button>
          </div>
        </div>

        <button id="again" class="primary">Construir otro XI</button>
      </section>`;

    root.querySelector("#prev").addEventListener("click", () => { if (idx > 0) { idx--; paint(); } });
    root.querySelector("#next").addEventListener("click", () => { if (idx < seasons.length - 1) { idx++; paint(); } });
    root.querySelectorAll(".rs-pill").forEach(b =>
      b.addEventListener("click", () => { idx = Number(b.dataset.i); paint(); }));
    root.querySelectorAll(".sh[data-net]").forEach(b =>
      b.addEventListener("click", () => openShare(b.dataset.net)));
    root.querySelector("#igBtn").addEventListener("click", downloadImage);
    root.querySelector("#again").addEventListener("click", onAgain);
    const toggleReal = root.querySelector("#toggleReal");
    if (toggleReal) toggleReal.addEventListener("click", () => { showReal = !showReal; paint(); });
    wireRanking();
  }

  // --- Real-life comparison ----------------------------------------------

  // How your managed run compares to how the real club actually did those years.
  function realComparisonSection() {
    const mineCell = (s) => s.inSegunda ? `2ª` : `${s.position}º · ${s.record.Pts}`;
    const realCell = (year) => {
      const r = realClubResult(yourClub, year);
      return r ? `${r.position}º · ${r.pts}` : `—`;
    };
    // Count seasons where you finished above the real club (both in Primera).
    let better = 0, comparable = 0;
    seasons.forEach((s) => {
      const r = realClubResult(yourClub, s.year);
      if (r && !s.inSegunda) { comparable++; if (s.position < r.position) better++; }
    });

    const button = `<button id="toggleReal" class="rs-real-btn">${showReal ? "Ocultar comparación" : `Comparar con el ${safeName} real`}</button>`;
    if (!showReal) {
      return `<div class="rs-real-box"><div class="rs-h">¿Lo hiciste mejor que la historia?</div>${button}</div>`;
    }
    const rows = seasons.map((s) => {
      const r = realClubResult(yourClub, s.year);
      const win = r && !s.inSegunda && s.position < r.position;
      return `
      <tr>
        <td class="yr">${seasonLabel(s.year)}</td>
        <td class="${win ? "win" : ""}">${mineCell(s)}</td>
        <td class="real">${realCell(s.year)}</td>
      </tr>`;
    }).join("");
    const verdict = comparable === 0
      ? `Sin temporadas comparables: el ${safeName} real no estuvo en Primera esos años.`
      : `Superaste al ${safeName} real en <b>${better}</b> de ${comparable} ${comparable === 1 ? "temporada comparable" : "temporadas comparables"}.`;
    return `
      <div class="rs-real-box">
        <div class="rs-h">Tú vs el ${safeName} real</div>
        <table class="rs-real-tbl">
          <tr class="hd"><td>Temporada</td><td>Tú · pts</td><td>Real · pts</td></tr>
          ${rows}
        </table>
        <div class="rs-real-verdict">${verdict}</div>
        <div class="rs-real-note">"—" = el club no jugó en Primera esa temporada.</div>
        ${button}
      </div>`;
  }

  // --- Daily leaderboard --------------------------------------------------

  function rankingSection() {
    if (!myEntry) {
      return `
        <div class="rs-rank-box">
          <div class="rs-h">Ranking del día · <span class="rs-rank-scope">${modeLabel}</span></div>
          <p class="rs-rank-intro">Añade tu nombre y compite con las partidas de hoy en modo <b>${modeLabel}</b>.</p>
          <div class="rs-rank-form">
            <input id="playerName" maxlength="20" placeholder="Tu nombre" autocomplete="off" />
            <button id="saveRank" class="primary">Entrar al ranking</button>
          </div>
        </div>`;
    }
    const tabs = [
      { key: "all", label: "General" },
      { key: "club", label: clubAbbr(yourClub) },
      { key: "season", label: yy(startYear) },
      { key: "clubSeason", label: `${clubAbbr(yourClub)} ${yy(startYear)}` },
    ];
    const scopeTitle = {
      all: "General",
      club: displayName,
      season: seasonLabel(startYear),
      clubSeason: `${displayName} · ${seasonLabel(startYear)}`,
    }[rankTab];
    const board = boards[rankTab];
    return `
      <div class="rs-rank-box">
        <div class="rs-h">Ranking del día · <span class="rs-rank-scope">${modeLabel}</span> · <span class="rs-rank-scope">${esc(scopeTitle)}</span></div>
        <div class="rs-rank-tabs">
          ${tabs.map(t => `<button class="rk-tab ${t.key === rankTab ? "on" : ""}" data-tab="${t.key}">${esc(t.label)}</button>`).join("")}
        </div>
        <table class="rs-rank-tbl">${boardRows(board)}</table>
        <div class="rs-rank-pos">Tu posición: <b>${board.myRank}º</b> de ${board.total}</div>
      </div>`;
  }

  function boardRows(board) {
    const { sorted, total, myRank } = board;
    const isMe = (e) => myEntry && e.ts === myEntry.ts && e.name === myEntry.name;
    const row = (e, rank) => `
      <tr class="${isMe(e) ? "me" : ""}">
        <td class="p">${rank}º</td>
        <td>${esc(e.name)}<div class="cl">${clubAbbr(e.club)} ${yy(e.year)}</div></td>
        <td class="pts">${e.pct}%</td>
      </tr>`;
    const gap = `<tr class="rk-gap"><td colspan="3">⋯</td></tr>`;

    // Small field: show everyone, ranked.
    if (total <= 10) return sorted.map((e, i) => row(e, i + 1)).join("");

    // Large field: top 5 (most %), then the player if mid-table, then bottom 5 (least %).
    const top = sorted.slice(0, 5).map((e, i) => row(e, i + 1)).join("");
    const bottom = sorted.slice(-5).map((e, i) => row(e, total - 5 + i + 1)).join("");
    const inMiddle = myRank > 5 && myRank <= total - 5;
    const mid = inMiddle ? gap + row(sorted[myRank - 1], myRank) : "";
    return top + mid + gap + bottom;
  }

  function wireRanking() {
    const saveBtn = root.querySelector("#saveRank");
    if (saveBtn) {
      const submit = () => {
        const name = root.querySelector("#playerName").value.trim();
        myEntry = addRankingEntry({ name, club: yourClub, year: startYear, pct, mode });
        boards = getDailyBoards(myEntry);
        paint();
      };
      saveBtn.addEventListener("click", submit);
      root.querySelector("#playerName").addEventListener("keydown", (e) => {
        if (e.key === "Enter") submit();
      });
    }
    root.querySelectorAll(".rk-tab").forEach(b =>
      b.addEventListener("click", () => { rankTab = b.dataset.tab; paint(); }));
  }
  paint();
}

// Rounded-rect path helper for the canvas share card.
function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}
