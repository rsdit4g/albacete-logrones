import { CLUBS } from "../data/clubs.js";

const SHARE_URL = "https://albacete-logrones.io";

// Escape text before interpolating into innerHTML.
function esc(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function ordinal(n) {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function verdictTier(best, titles) {
  if (titles >= 3) return "DINASTÍA";
  if (titles >= 1) return "CAMPEÓN";
  if (best <= 4) return "EUROPA";
  if (best <= 10) return "MEDIA TABLA";
  return "SUFRIMIENTO";
}

// Renders the season-by-season results + a five-year summary + sharing.
// `yourClub` is the real club name the player managed.
export function renderResults(root, seasons, yourClub, onAgain) {
  let idx = 0;
  const displayName = CLUBS[yourClub]?.name || yourClub;
  const safeName = esc(displayName);

  const positions = seasons.map(s => s.position);
  const best = Math.min(...positions);
  const worst = Math.max(...positions);
  const titles = seasons.filter(s => s.honours.includes("La Liga")).length;
  const cups = seasons.filter(s => s.honours.includes("Copa del Rey")).length;
  const tier = verdictTier(best, titles);

  function clubLabel(code) {
    return code === yourClub ? safeName : esc(CLUBS[code]?.name || code);
  }

  function shareText() {
    const arc = positions.map(p => `${p}º`).join(" · ");
    const honours = titles ? `, ${titles}× Liga` : "";
    return `⚽ ${displayName} en Albacete–Logroñés: ${arc} en 5 temporadas. ` +
           `Mejor: ${best}º${honours} (${tier}). ¿Puedes mejorarlo? ${SHARE_URL}`;
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
      g.fillStyle = s.position === 1 ? "#3a2f00" : "#161622";
      g.strokeStyle = s.position === 1 ? "#f5d040" : "#2a2a3a";
      g.lineWidth = 3;
      roundRect(g, x, y, pillW, ph, 18); g.fill(); g.stroke();
      g.fillStyle = s.position === 1 ? "#f5d040" : "#fff";
      g.font = "900 76px Inter, system-ui, sans-serif";
      g.textAlign = "center";
      g.fillText(String(s.position), x + pillW / 2, y + 110);
      g.fillStyle = "#9aa";
      g.font = "600 26px Inter, system-ui, sans-serif";
      g.fillText(`'${String(s.year % 100).padStart(2, "0")}`, x + pillW / 2, y + 160);
      x += pillW + gap;
    });
    g.fillStyle = "#cfcfe0";
    g.font = "600 34px Inter, system-ui, sans-serif";
    g.fillText(`Mejor: ${best}º   ·   ${titles}× Liga   ·   ${cups}× Copa`, W / 2, 760);
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

        <div class="rs-banner">
          <div class="rs-rank">${ordinal(r.position)}</div>
          <div class="rs-rec">
            <b>${safeName}</b><br>
            P${rec.P} · ${rec.W}W ${rec.D}D ${rec.L}L · ${rec.GF}–${rec.GA} · <b>${rec.Pts} pts</b>
          </div>
        </div>

        <div class="rs-grid">
          <div>
            <div class="rs-h">Clasificación final</div>
            <table class="rs-tbl">${r.table.map((row, i) =>
              `<tr class="${row.isYou ? "me" : ""}"><td class="p">${i + 1}</td>
               <td>${clubLabel(row.club)}</td><td class="pts">${row.pts}</td></tr>`).join("")}
            </table>
          </div>
          <div>
            <div class="rs-h">Máximos goleadores</div>
            <table class="rs-sc">${r.topScorers.map(s =>
              `<tr class="${s.isYou ? "me" : ""}"><td>${esc(s.name)}<div class="cl">${clubLabel(s.club)}</div></td>
               <td class="g">${s.goals}</td></tr>`).join("")}
            </table>
            <div class="rs-h" style="margin-top:12px">Títulos</div>
            <div class="rs-hon">${r.honours.length ? r.honours.map(h => `🏆 ${h}`).join("<br>") : "—"}</div>
          </div>
        </div>

        <div class="rs-summary">
          <div class="rs-h">Resumen · 5 temporadas</div>
          <div class="rs-verdict">${tier}</div>
          <div class="rs-pills">
            ${seasons.map((s, i) => `
              <button class="rs-pill ${s.position === 1 ? "win" : ""} ${i === idx ? "cur" : ""}" data-i="${i}">
                <b>${s.position}</b><small>'${String(s.year % 100).padStart(2, "0")}</small>
              </button>`).join("")}
          </div>
          <div class="rs-summary-stats">Mejor: ${ordinal(best)} · Peor: ${ordinal(worst)} · ${titles}× Liga · ${cups}× Copa</div>
        </div>

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
