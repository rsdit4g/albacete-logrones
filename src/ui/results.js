import { CLUBS } from "../data/clubs.js?v=16";
import { addRankingEntry, getDailyBoards } from "../game/leaderboard.js?v=22";

const SHARE_URL = "https://albacete-logrones.io";

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
export function renderResults(root, seasons, yourClub, onAgain) {
  let idx = 0;
  const displayName = CLUBS[yourClub]?.name || yourClub;
  const safeName = esc(displayName);
  const startYear = seasons[0].year;

  // Leaderboard state: filled once the player saves their run.
  let myEntry = null;
  let boards = null;
  let rankTab = "all";

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
    return `⚽ ${displayName} en Albacete–Logroñés: ${arc} en 5 temporadas. ` +
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
    g.fillText("ALBACETE – LOGROÑÉS", W / 2, 120);
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

        ${rankingSection()}

        <div class="rs-share">
          <div class="rs-h">Comparte tu resultado</div>
          <div class="rs-share-btns">
            <button class="sh sh-wa" data-net="whatsapp">WhatsApp</button>
            <button class="sh sh-fb" data-net="facebook">Facebook</button>
            <button class="sh sh-x" data-net="x">X</button>
            <button class="sh sh-ig" id="igBtn">Imagen (Instagram)</button>
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
    wireRanking();
  }

  // --- Daily leaderboard --------------------------------------------------

  function rankingSection() {
    if (!myEntry) {
      return `
        <div class="rs-rank-box">
          <div class="rs-h">Ranking del día</div>
          <p class="rs-rank-intro">Añade tu nombre y compite con todas las partidas de hoy.</p>
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
        <div class="rs-h">Ranking del día · <span class="rs-rank-scope">${esc(scopeTitle)}</span></div>
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
        myEntry = addRankingEntry({ name, club: yourClub, year: startYear, pct });
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
